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

module.exports = { readJsonData, incrementBillNumbers };
