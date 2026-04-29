const { PDFDocument, PDFRawStream, PDFNumber, PDFName } = require('pdf-lib');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/**
 * Increments the SRN No values inside a PDF's FlateDecode content streams.
 *
 * Each page stream has one SRN at anchor position x=463.9 y=371.5.
 * The entire SRN (prefix + digits) is encoded as individual characters inside
 * a single TJ array, e.g.:
 *   [(U)11(R)11(N)17(2)14(6)14(8)14(8)14(5)] TJ  →  "URN26885"
 *
 * Incrementing replaces each digit (d) item in-place with the new digit:
 *   URN26885 → URN26886  →  last (5) becomes (6)
 *
 * A sidecar .srnstate file (JSON array, one entry per stream) tracks the
 * last-written SRNs. If state and PDF disagree, the PDF is authoritative.
 */
async function incrementSrnInPdf(filePath) {
    const stateFile = filePath + '.srnstate';
    const buf = fs.readFileSync(filePath);

    // Load state: JSON array, one SRN string per matching stream.
    let stateArr = [];
    if (fs.existsSync(stateFile)) {
        try {
            const raw = fs.readFileSync(stateFile, 'utf8').trim();
            stateArr = raw.startsWith('[') ? JSON.parse(raw) : [raw];
        } catch (e) { /* start fresh on parse error */ }
    }

    const pdfDoc = await PDFDocument.load(buf);
    const { context } = pdfDoc;

    const newSrns = [];
    let matchIdx = 0;

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
        if (!(obj instanceof PDFRawStream)) continue;

        const filter = obj.dict.get(PDFName.of('Filter'));
        if (!filter || !filter.toString().includes('FlateDecode')) continue;

        let content;
        try {
            content = zlib.inflateSync(Buffer.from(obj.contents)).toString('binary');
        } catch (e) { continue; }

        // ── Find the SRN value TJ — supports two PDF layouts: ──
        // Layout A: Full SRN (label + number) in one TJ at a fixed position,
        //           e.g. [(U)(R)(N)(2)(6)(8)(8)(5)] TJ  →  "URN26885"
        // Layout B: "SRN" label in one TJ, the number in a later TJ on the same
        //           row (y within ~2pt), e.g. (SRN) ... (1)(6)(5)(4)  →  "1654"

        // Extract all TJ arrays and Tj literals with their preceding Tm coordinates
        const tjRegex = /([\d.]+)\s+([\d.]+)\s+Tm(?:(?:(?!\s+Tm).)*?)\[([^\]]+)\]\s*TJ/gs;
        const tjSimpleRegex = /([\d.]+)\s+([\d.]+)\s+Tm(?:(?:(?!\s+Tm).)*?)\(([^)]+)\)\s*Tj/gs;
        const allTjs = [];
        let tm;
        while ((tm = tjRegex.exec(content)) !== null) {
            const chars = [...tm[3].matchAll(/\(([^)]+)\)/g)].map(m => m[1]).join('');
            allTjs.push({ x: parseFloat(tm[1]), y: parseFloat(tm[2]), chars, tjContent: tm[3], form: 'TJ', full: tm[0] });
        }
        while ((tm = tjSimpleRegex.exec(content)) !== null) {
            allTjs.push({ x: parseFloat(tm[1]), y: parseFloat(tm[2]), chars: tm[3], tjContent: tm[3], form: 'Tj', full: tm[0] });
        }

        // Find the SRN target: prefer Layout B (explicit SRN label), fallback to Layout A
        let srnTj = null;
        let srnExtract = null;

        // Layout B: find "SRN"/"Salvage Ref No" label, then the nearest numeric/alphanumeric TJ on the same row
        const labelTj = allTjs.find(t => {
            const c = t.chars.trim();
            return /^SRN(\s|No|:)?$/i.test(c) || c === 'SRN' || /^Salvage\s*Ref\s*No$/i.test(c);
        });
        if (labelTj) {
            const candidate = allTjs
                .filter(t => Math.abs(t.y - labelTj.y) < 3 && t.x > labelTj.x && /^[A-Z]*\d+$/.test(t.chars))
                .sort((a, b) => a.x - b.x)[0];
            if (candidate) {
                srnTj = candidate;
                srnExtract = candidate.chars;
            }
        }

        // Layout A: if no label found, look for a standalone URN-style token (letters + digits)
        if (!srnTj) {
            for (const t of allTjs) {
                const m = t.chars.match(/^(URN\d+|SRN\d+|SLV\d+)$/i);
                if (m) { srnTj = t; srnExtract = m[1]; break; }
            }
        }

        if (!srnTj || !srnExtract) {
            // This stream has no SRN — skip silently (PDF may have label-only pages)
            continue;
        }

        const tjContent = srnTj.tjContent;

        // ── Determine base SRN — PDF is authoritative over state ──
        const stateSrn = stateArr[matchIdx];
        if (stateSrn && stateSrn !== srnExtract) {
            console.warn(`[pdfUtils] Stream ${matchIdx + 1}: state "${stateSrn}" ≠ PDF "${srnExtract}". Using PDF value.`);
        }
        const baseSrn = srnExtract;

        // Parse SRN into optional letter prefix + digits
        const pm = baseSrn.match(/^([A-Za-z]*)(\d+)$/);
        if (!pm) throw new Error(`Unexpected SRN format: "${baseSrn}"`);

        const newSrn = pm[1] + String(parseInt(pm[2], 10) + 1).padStart(pm[2].length, '0');
        const newDigits = newSrn.slice(pm[1].length); // digit portion only

        console.log(`[pdfUtils] Stream ${matchIdx + 1} SRN: ${baseSrn} → ${newSrn}`);
        newSrns.push(newSrn);

        // ── Patch the stream content with the new SRN ──
        let newContent;
        if (srnTj.form === 'Tj') {
            // Tj form: whole SRN is a single literal — (URN26885)Tj or (URN26885) Tj.
            // Use the captured full match to preserve whatever whitespace the PDF used.
            const newFull = srnTj.full.replace(`(${srnExtract})`, `(${newSrn})`);
            newContent = content.replace(srnTj.full, newFull);
        } else {
            // TJ-array form — replace the digits inside the array
            // Layout A (single-digit groups): (1)(6)(5)(4)  →  replace each (d) in order
            // Layout B (multi-digit group):   (1654)         →  replace the whole digit run
            let newTJContent;
            if (/\(\d{2,}\)/.test(tjContent)) {
                let dIdx = 0;
                newTJContent = tjContent.replace(/\((\d+)\)/g, (_, oldDigits) => {
                    const len = oldDigits.length;
                    const slice = newDigits.substr(dIdx, len);
                    dIdx += len;
                    return '(' + slice + ')';
                });
            } else {
                let dIdx = 0;
                newTJContent = tjContent.replace(/\((\d)\)/g, () => {
                    return '(' + (newDigits[dIdx++] ?? '0') + ')';
                });
            }
            newContent = content.replace(
                '[' + tjContent + '] TJ',
                '[' + newTJContent + '] TJ'
            );
        }

        const newCompressed = zlib.deflateSync(Buffer.from(newContent, 'binary'));
        obj.dict.set(PDFName.of('Length'), PDFNumber.of(newCompressed.length));
        context.assign(ref, PDFRawStream.of(obj.dict, newCompressed));

        matchIdx++;
    }

    if (newSrns.length === 0) throw new Error(`No SRN found in PDF: ${filePath}`);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    fs.writeFileSync(stateFile, JSON.stringify(newSrns));
    return newSrns;
}

/**
 * Replace invoice numbers and dates in a brand's Invoice Re-Upload PDF in place.
 *
 * Reads test-data/InvoicePdfUpload/{brand}.js for rows to inject. Each row is
 * `{ number, date }` (date in DD.MM.YYYY). The PDF has paired streams per
 * invoice slot: one holds `(: <value>) Tj` for the number, a later stream
 * holds `(INV DATE   : <value>) Tj` for the date. Legacy string entries
 * (number-only) are also accepted and skip the date patch.
 */
async function replaceInvoiceNumbersInPdf(brand) {
    const baseDir = path.join(__dirname, '..', 'test-data', 'InvoicePdfUpload');
    const pdfPath = path.join(baseDir, `${brand}.pdf`);
    const configPath = path.join(baseDir, `${brand}.js`);

    delete require.cache[require.resolve(configPath)];
    const invoices = require(configPath);
    if (!Array.isArray(invoices) || invoices.length === 0) {
        throw new Error(`${configPath} must export a non-empty array`);
    }

    const rows = invoices.map((x, i) => {
        if (typeof x === 'string') return { number: x, date: null };
        if (x && typeof x === 'object' && x.number) return { number: x.number, date: x.date || null };
        throw new Error(`${configPath}[${i}] must be a string or { number, date }`);
    });

    const buf = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(buf);
    const { context } = pdfDoc;

    let numSlotIdx = 0;
    let dateSlotIdx = 0;

    for (const [ref, obj] of context.enumerateIndirectObjects()) {
        if (!(obj instanceof PDFRawStream)) continue;

        const filter = obj.dict.get(PDFName.of('Filter'));
        if (!filter || !filter.toString().includes('FlateDecode')) continue;

        let content;
        try {
            content = zlib.inflateSync(Buffer.from(obj.contents)).toString('binary');
        } catch (e) { continue; }

        const hasNum = /\(:\s+[A-Za-z0-9]+\)\s*Tj/.test(content);
        const hasDate = /\(INV DATE\s+:\s+[0-9.\-]+\)\s*Tj/.test(content);
        if (!hasNum && !hasDate) continue;

        let mutated = false;

        if (hasNum) {
            if (numSlotIdx >= rows.length) {
                throw new Error(
                    `${pdfPath} has more invoice slots than entries provided in ${brand}.js ` +
                    `(provided ${rows.length}, encountered slot ${numSlotIdx + 1})`
                );
            }
            const newNumber = rows[numSlotIdx].number;
            if (!/^[A-Za-z0-9]+$/.test(String(newNumber))) {
                throw new Error(`Invoice number at index ${numSlotIdx} in ${brand}.js is invalid: "${newNumber}"`);
            }
            const oldMatch = content.match(/\((:\s+)([A-Za-z0-9]+)\)\s*Tj/);
            const oldValue = oldMatch[2];
            content = content.replace(
                /\((:\s+)[A-Za-z0-9]+\)\s*Tj/,
                `(${oldMatch[1]}${newNumber}) Tj`
            );
            console.log(`[pdfUtils] ${brand}.pdf invoice slot ${numSlotIdx + 1}: ${oldValue} → ${newNumber}`);
            numSlotIdx++;
            mutated = true;
        }

        if (hasDate) {
            if (dateSlotIdx >= rows.length) {
                throw new Error(
                    `${pdfPath} has more INV DATE slots than entries provided in ${brand}.js ` +
                    `(provided ${rows.length}, encountered slot ${dateSlotIdx + 1})`
                );
            }
            const newDate = rows[dateSlotIdx].date;
            if (newDate) {
                if (!/^[0-9.\-]+$/.test(String(newDate))) {
                    throw new Error(`Invoice date at index ${dateSlotIdx} in ${brand}.js is invalid: "${newDate}"`);
                }
                const oldMatch = content.match(/\((INV DATE\s+:\s+)([0-9.\-]+)\)\s*Tj/);
                const oldValue = oldMatch[2];
                content = content.replace(
                    /\((INV DATE\s+:\s+)[0-9.\-]+\)\s*Tj/,
                    `(${oldMatch[1]}${newDate}) Tj`
                );
                console.log(`[pdfUtils] ${brand}.pdf date slot ${dateSlotIdx + 1}: ${oldValue} → ${newDate}`);
                mutated = true;
            }
            dateSlotIdx++;
        }

        if (mutated) {
            const newCompressed = zlib.deflateSync(Buffer.from(content, 'binary'));
            obj.dict.set(PDFName.of('Length'), PDFNumber.of(newCompressed.length));
            context.assign(ref, PDFRawStream.of(obj.dict, newCompressed));
        }
    }

    if (numSlotIdx === 0) {
        throw new Error(`No invoice number slots found in ${pdfPath}`);
    }
    if (numSlotIdx < rows.length) {
        console.warn(
            `[pdfUtils] ${brand}.js provided ${rows.length} entries but PDF has ${numSlotIdx} number slots — extras ignored`
        );
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);
    return pdfPath;
}

module.exports = { incrementSrnInPdf, replaceInvoiceNumbersInPdf };
