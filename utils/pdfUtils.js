const { PDFDocument, PDFRawStream, PDFNumber, PDFName } = require('pdf-lib');
const zlib = require('zlib');
const fs = require('fs');

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

        // Extract all TJ arrays with their preceding Tm coordinates
        const tjRegex = /([\d.]+)\s+([\d.]+)\s+Tm(?:(?:(?!\s+Tm).)*?)\[([^\]]+)\]\s*TJ/gs;
        const allTjs = [];
        let tm;
        while ((tm = tjRegex.exec(content)) !== null) {
            const chars = [...tm[3].matchAll(/\(([^)]+)\)/g)].map(m => m[1]).join('');
            allTjs.push({ x: parseFloat(tm[1]), y: parseFloat(tm[2]), chars, tjContent: tm[3], full: tm[0] });
        }

        // Find the SRN target: prefer Layout B (explicit SRN label), fallback to Layout A
        let srnTj = null;
        let srnExtract = null;

        // Layout B: find "SRN" label, then the nearest numeric/alphanumeric TJ on the same row
        const labelTj = allTjs.find(t => /^SRN(\s|No|:)?$/i.test(t.chars.trim()) || t.chars.trim() === 'SRN');
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
                const m = t.chars.match(/^(URN\d+|SRN\d+)$/i);
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

        // ── Replace the digits in the TJ with the new digits ──
        // Layout A (single-digit groups): (1)(6)(5)(4)  →  replace each (d) in order
        // Layout B (multi-digit group):   (1654)         →  replace the whole digit run
        let newTJContent;
        if (/\(\d{2,}\)/.test(tjContent)) {
            // At least one group has 2+ digits — replace digit runs wholesale
            let dIdx = 0;
            newTJContent = tjContent.replace(/\((\d+)\)/g, (_, oldDigits) => {
                const len = oldDigits.length;
                const slice = newDigits.substr(dIdx, len);
                dIdx += len;
                return '(' + slice + ')';
            });
        } else {
            // Single-digit-per-group format
            let dIdx = 0;
            newTJContent = tjContent.replace(/\((\d)\)/g, () => {
                return '(' + (newDigits[dIdx++] ?? '0') + ')';
            });
        }

        // ── Patch the stream content and recompress ──
        const newContent = content.replace(
            '[' + tjContent + '] TJ',
            '[' + newTJContent + '] TJ'
        );

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

module.exports = { incrementSrnInPdf };
