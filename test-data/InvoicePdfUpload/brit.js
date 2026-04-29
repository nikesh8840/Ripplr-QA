const fs = require('fs');
const path = require('path');

const ordersCsvPath = path.join(__dirname, '..', 'Orders', 'brit', 'm1.csv');

function readInvoiceData(csvPath) {
    const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(l => l.trim() !== '');
    const header = lines[0].split(',');
    const numIdx = header.findIndex(c => c.trim() === 'Invoice No');
    const dateIdx = header.findIndex(c => c.trim() === 'Invoice Date');
    if (numIdx === -1) throw new Error(`Column 'Invoice No' not found in ${csvPath}`);
    if (dateIdx === -1) throw new Error(`Column 'Invoice Date' not found in ${csvPath}`);

    const seen = new Set();
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const number = (cols[numIdx] || '').trim();
        // CSV uses DD-MM-YYYY; PDF template uses DD.MM.YYYY — normalize to dots.
        const date = (cols[dateIdx] || '').trim().replace(/-/g, '.');
        if (number && !seen.has(number)) {
            seen.add(number);
            rows.push({ number, date });
        }
    }
    return rows;
}

module.exports = readInvoiceData(ordersCsvPath);