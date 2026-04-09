const fs = require('fs');

function readJsonData(path) {
    const rawData = fs.readFileSync(path);
    return JSON.parse(rawData);
}

async function incrementBillNumbers(csvFilePath, columnHeaderName = 'Bill Number') {
    try {
        // Read the CSV file
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n');
        
        if (lines.length < 2) return; // No data to process
        
        // Parse header to find the column
        const header = lines[0].split(',');
        const columnIndex = header.findIndex(col => col.trim() === columnHeaderName);
        
        if (columnIndex === -1) {
            console.warn(`Column '${columnHeaderName}' not found in CSV`);
            return;
        }
        
        // Process each data row and increment the character before the first digit sequence
        const updatedLines = [lines[0]]; // Keep header as is
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines
            
            const columns = lines[i].split(',');
            const value = columns[columnIndex].trim();
            
            // Find the position of the first digit
            const firstDigitPos = value.search(/\d/);
            
            if (firstDigitPos > 0) {
                // There's at least one character before the first digit
                const charBeforeDigit = value[firstDigitPos - 1];
                let incrementedChar = charBeforeDigit;
                
                // Increment based on character type
                if (/[A-Z]/.test(charBeforeDigit)) {
                    // Uppercase letter
                    if (charBeforeDigit === 'Z') {
                        incrementedChar = 'A';
                    } else {
                        incrementedChar = String.fromCharCode(charBeforeDigit.charCodeAt(0) + 1);
                    }
                } else if (/[a-z]/.test(charBeforeDigit)) {
                    // Lowercase letter
                    if (charBeforeDigit === 'z') {
                        incrementedChar = 'a';
                    } else {
                        incrementedChar = String.fromCharCode(charBeforeDigit.charCodeAt(0) + 1);
                    }
                } else if (/\d/.test(charBeforeDigit)) {
                    // Digit - increment it
                    const digit = parseInt(charBeforeDigit, 10);
                    if (digit === 9) {
                        incrementedChar = '0';
                    } else {
                        incrementedChar = String(digit + 1);
                    }
                }
                
                // Replace the character before the first digit
                columns[columnIndex] = value.slice(0, firstDigitPos - 1) + incrementedChar + value.slice(firstDigitPos);
            }
            
            updatedLines.push(columns.join(','));
        }
        
        // Write updated content back to file
        fs.writeFileSync(csvFilePath, updatedLines.join('\n'), 'utf-8');
        console.log(`Values in '${columnHeaderName}' column incremented successfully`);
    } catch (error) {
        console.error('Error incrementing values:', error);
    }
}

/**
 * Sync the first `rowCount` rows of `returnInvoiceCol` in the return file
 * to match the corresponding `salesBillCol` values in the sales order file.
 * Only rows that do NOT already match are updated.
 */
async function syncInvoiceNumbers(
    salesOrderPath,
    returnFilePath,
    salesBillCol = 'Bill Number',
    returnInvoiceCol = 'Reg InvoiceNumber',
    rowCount = 3
) {
    try {
        const stripBom = (s) => s.replace(/^\uFEFF/, '');

        const soContent = stripBom(fs.readFileSync(salesOrderPath, 'utf-8'));
        const soLines   = soContent.split('\n').filter(l => l.trim() !== '');
        const soHeader  = soLines[0].split(',');
        const soBillIdx = soHeader.findIndex(c => c.trim() === salesBillCol);

        if (soBillIdx === -1) {
            console.warn(`Column '${salesBillCol}' not found in sales order file`);
            return;
        }

        const retContent = fs.readFileSync(returnFilePath, 'utf-8');
        const retLines   = retContent.split('\n');
        const retHeader  = retLines[0].split(',');
        const retInvIdx  = retHeader.findIndex(c => c.trim() === returnInvoiceCol);

        if (retInvIdx === -1) {
            console.warn(`Column '${returnInvoiceCol}' not found in return file`);
            return;
        }

        let changed = false;
        for (let i = 0; i < rowCount; i++) {
            const soDataLine  = soLines[i + 1];   // +1 to skip header
            const retLineIdx  = i + 1;             // index in retLines (1-based data rows)
            if (!soDataLine || !retLines[retLineIdx]) break;

            const soVal  = soDataLine.split(',')[soBillIdx].trim();
            const retCols = retLines[retLineIdx].split(',');
            const retVal  = retCols[retInvIdx].trim();

            if (soVal !== retVal) {
                console.log(`Row ${i + 1}: '${returnInvoiceCol}' mismatch — updating '${retVal}' → '${soVal}'`);
                retCols[retInvIdx] = soVal;
                retLines[retLineIdx] = retCols.join(',');
                changed = true;
            } else {
                console.log(`Row ${i + 1}: '${returnInvoiceCol}' matches ('${soVal}') — no change`);
            }
        }

        if (changed) {
            fs.writeFileSync(returnFilePath, retLines.join('\n'), 'utf-8');
            console.log(`'${returnInvoiceCol}' column synced successfully`);
        } else {
            console.log(`All ${rowCount} rows already match — no update needed`);
        }
    } catch (error) {
        console.error('Error syncing invoice numbers:', error);
    }
}

/**
 * Recalculates the 'Gross Amount' column in a sales return CSV using tax percentages.
 *
 * Rules (applied per row):
 *   • CGST Perc > 0  → Gross Amt = (Gross Amt / (1 + (SGST Perc + CGST Perc) / 100)) - Cess - TCS
 *   • IGST Perc > 0  → Gross Amt = (Gross Amt / (1 + IGST Perc / 100)) - Cess - TCS
 *   • Tax value missing/NaN → keep row as-is
 *   • Both 0          → copy Gross Amount unchanged
 *
 * Result is rounded to 4 decimal places and written back to the file.
 *
 * @param {string} csvFilePath
 * @param {object} [cols] - override column header names if they differ from defaults
 */
async function recalculateGrossAmount(csvFilePath, cols = {}) {
    const COL = {
        grossAmount:  cols.grossAmount  || 'Gross Amount',
        cgstPerc:     cols.cgstPerc     || 'CGST Perc',
        sgstPerc:     cols.sgstPerc     || 'SGST Perc',
        igstPerc:     cols.igstPerc     || 'IGST Perc',
        cessAmount:   cols.cessAmount   || 'Cess Amount',
        tcsTaxAmount: cols.tcsTaxAmount || 'TCS Tax Amount',
        schmdisc:      cols.schmdisc    || 'Sch Disc',
        cgstamount:    cols.cgstAmount  || 'CGSTAmt',
        sgstamount:    cols.sgstAmount  || 'SGSTAmt',
        igstamount:    cols.igstAmount  || 'IGSTAmt',
    };

    try {
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n');
        if (lines.length < 2) return;

        const header = lines[0].split(',');
        const idx = (name) => header.findIndex(h => h.trim() === name);

        const grossIdx   = idx(COL.grossAmount);
        const cgstIdx    = idx(COL.cgstPerc);
        const sgstIdx    = idx(COL.sgstPerc);
        const igstIdx    = idx(COL.igstPerc);
        const cessIdx    = idx(COL.cessAmount);
        const tcsIdx     = idx(COL.tcsTaxAmount);
        const schmIdx    = idx(COL.schmdisc);
        const cgstAmtIdx = idx(COL.cgstamount);
        const sgstAmtIdx = idx(COL.sgstamount);
        const igstAmtIdx = idx(COL.igstamount);

        if (grossIdx === -1 || cgstIdx === -1 || sgstIdx === -1 || igstIdx === -1 || schmIdx === -1 || cgstAmtIdx === -1 || sgstAmtIdx === -1 || igstAmtIdx === -1) {
            console.warn('recalculateGrossAmount: required column(s) not found, skipping');
            return;
        }

        // Idempotency: back up original Gross Amounts in a JSON sidecar file on first run.
        // Subsequent runs always recalculate from the sidecar so values don't compound.
        // The sidecar is never uploaded — only the CSV is sent to CDMS.
        const sidecarPath = csvFilePath + '.orig.json';
        let origGrossMap;   // key = row index (1-based), value = original gross amount

        if (fs.existsSync(sidecarPath)) {
            origGrossMap = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
        } else {
            // First run — capture originals from the current (unmodified) CSV
            origGrossMap = {};
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                const cols = lines[i].split(',');
                origGrossMap[i] = cols[grossIdx];   // store as string to preserve precision
            }
            fs.writeFileSync(sidecarPath, JSON.stringify(origGrossMap, null, 2), 'utf-8');
        }

        const updatedLines = [lines[0]];   // header unchanged — no extra column added

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const columns = lines[i].split(',');

            // Always recalculate from the backed-up original, not the current (possibly modified) value
            const rawGross  = parseFloat(origGrossMap[i] ?? columns[grossIdx]);
            const cgst      = parseFloat(columns[cgstIdx]);
            const sgst      = parseFloat(columns[sgstIdx]);
            const igst      = parseFloat(columns[igstIdx]);
            const cess      = cessIdx !== -1 ? (parseFloat(columns[cessIdx]) || 0) : 0;
            const tcs       = tcsIdx  !== -1 ? (parseFloat(columns[tcsIdx])  || 0) : 0;
            const schmDisc  = schmIdx !== -1 ? (parseFloat(columns[schmIdx]) || 0) : 0;
            const cgstAmt   = cgstAmtIdx !== -1 ? parseFloat(columns[cgstAmtIdx]) : 0;
            const sgstAmt   = sgstAmtIdx !== -1 ? parseFloat(columns[sgstAmtIdx]) : 0;
            const igstAmt   = igstAmtIdx !== -1 ? parseFloat(columns[igstAmtIdx]) : 0;

            // If any required tax/gross value is missing, keep row as-is
            if (isNaN(rawGross) || isNaN(cgst) || isNaN(sgst) || isNaN(igst) || isNaN(cess) || isNaN(tcs) || isNaN(schmDisc) || isNaN(cgstAmt) || isNaN(sgstAmt) || isNaN(igstAmt)) {
                updatedLines.push(columns.join(','));
                continue;
            }

            let newGross;
            if (cgst > 0) {
                newGross = (rawGross / (1 + (sgst + cgst) / 100)) - schmDisc + cgstAmt + sgstAmt;
                console.log(`Row ${i}: CGST/SGST path → ${rawGross} / (1 + ${sgst + cgst}%) - ${schmDisc} + ${cgstAmt} + ${sgstAmt} = ${newGross.toFixed(4)}`);
            } else if (igst > 0) {
                newGross = (rawGross / (1 + igst / 100)) - schmDisc + igstAmt;
                console.log(`Row ${i}: IGST path → ${rawGross} / (1 + ${igst}%) - ${schmDisc} + ${igstAmt} = ${newGross.toFixed(4)}`);
            } else {
                // Both 0 — copy as-is
                updatedLines.push(columns.join(','));
                continue;
            }

            columns[grossIdx] = newGross.toFixed(4);
            updatedLines.push(columns.join(','));
        }

        fs.writeFileSync(csvFilePath, updatedLines.join('\n'), 'utf-8');
        console.log(`Gross Amount recalculated and saved: ${csvFilePath}`);
    } catch (error) {
        console.error('Error recalculating gross amount:', error);
    }
}

module.exports = { readJsonData, incrementBillNumbers, syncInvoiceNumbers, recalculateGrossAmount };
