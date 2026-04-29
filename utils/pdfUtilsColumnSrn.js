const { PDFDocument, PDFRawStream, PDFNumber, PDFName } = require('pdf-lib');
const zlib = require('zlib');
const fs = require('fs');

/**
 * Increments the "Sales Return No" values inside a PDF whose layout uses a
 * column header (Marico Return Request PDFs).
 *
 * Layout: the header label "Sales Return No" sits at the top of a table column
 * (often split across two lines as "Sales Return" / "No"); the value(s) appear
 * directly *below* the header in the same column. A single sales return can
 * span multiple table rows, so the same value may be repeated within one page
 * stream — every occurrence in that stream is incremented in lockstep.
 *
 * A sidecar .srnstate file (JSON array, one entry per stream) tracks the
 * last-written SRN per page. PDF text is authoritative if state and PDF
 * disagree.
 *
 * Kept separate from utils/pdfUtils.js#incrementSrnInPdf so existing PDF
 * upload flows (URN/Salvage Ref No layouts) are not affected.
 */
async function incrementSalesReturnNoInPdf(filePath) {
    const stateFile = filePath + '.srnstate';
    const buf = fs.readFileSync(filePath);

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

        // Extract every Tm-prefixed Tj literal (and TJ array) with coordinates
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

        // Find the column header label — accept "Sales Return No" or just "Sales Return"
        // (the "No" portion may be on the next line)
        const labelTj = allTjs.find(t => /^Sales\s*Return(\s*No)?$/i.test(t.chars.trim()));
        if (!labelTj) continue;

        // Find the value directly below the label, within ~50pt horizontally
        // (column width). Closest below = largest y under the label's y.
        const candidate = allTjs
            .filter(t => t.y < labelTj.y && Math.abs(t.x - labelTj.x) < 50 && /^[A-Z]*\d+$/.test(t.chars))
            .sort((a, b) => b.y - a.y)[0];
        if (!candidate) continue;

        const srnExtract = candidate.chars;

        const stateSrn = stateArr[matchIdx];
        if (stateSrn && stateSrn !== srnExtract) {
            console.warn(`[pdfUtilsColumnSrn] Stream ${matchIdx + 1}: state "${stateSrn}" ≠ PDF "${srnExtract}". Using PDF value.`);
        }

        const pm = srnExtract.match(/^([A-Za-z]*)(\d+)$/);
        if (!pm) throw new Error(`Unexpected Sales Return No format: "${srnExtract}"`);
        const newSrn = pm[1] + String(parseInt(pm[2], 10) + 1).padStart(pm[2].length, '0');

        console.log(`[pdfUtilsColumnSrn] Stream ${matchIdx + 1} Sales Return No: ${srnExtract} → ${newSrn}`);
        newSrns.push(newSrn);

        // Patch every Tj block in this stream that holds the same value.
        // A return spanning multiple line items repeats the SRN once per row,
        // so every occurrence must move together. Each block's .full begins
        // with its own unique Tm coordinates, so replaces don't collide.
        let newContent = content;
        for (const t of allTjs) {
            if (t.form !== 'Tj' || t.chars !== srnExtract) continue;
            const newFull = t.full.replace(`(${srnExtract})`, `(${newSrn})`);
            newContent = newContent.replace(t.full, newFull);
        }

        const newCompressed = zlib.deflateSync(Buffer.from(newContent, 'binary'));
        obj.dict.set(PDFName.of('Length'), PDFNumber.of(newCompressed.length));
        context.assign(ref, PDFRawStream.of(obj.dict, newCompressed));

        matchIdx++;
    }

    if (newSrns.length === 0) throw new Error(`No "Sales Return No" value found in PDF: ${filePath}`);

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    fs.writeFileSync(stateFile, JSON.stringify(newSrns));
    return newSrns;
}

module.exports = { incrementSalesReturnNoInPdf };
