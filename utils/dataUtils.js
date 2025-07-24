const fs = require('fs');

function readJsonData(path) {
    const rawData = fs.readFileSync(path);
    return JSON.parse(rawData);
}

module.exports = { readJsonData };
