
const path = require('path');

const getFCName = (fcCode) => {
    const fcMap = {
        'erhs': 'ERHS: E Ripplr HosaRoad',
        'btml': 'BTML: BTM',
        'yspr': 'YSPR: Yeshwantpura',
        'peenya': 'PNYA: Peenya',
        'plvm': 'PLVM: Pallavaram',
        'mdpt': 'MDPT: Mehdipatnam',
        'hrmv': 'HRMV: Horamavu',
        'bndp': 'BNDP: Bhandup',
        'bgrd': 'BGRD: Begur Road',
        'tlbl': 'TLBL: Mysore Road',
        'byti': 'BYTI: Byrathi',
        'nmbl': 'NMBL: Noombal'
    };
    return fcMap[fcCode] || fcCode;
};

const getBrandName = (brandCode) => {
    const brandMap = {
        'britania': 'BRIT: Britania',
        'britannia': 'BRIT: Britannia',
        'apx': 'APX: APX',
        'hul': 'HUL: HUL',
        'huls': 'HULS: HUL Samadhan',
        'sunpure': 'SNPR: Sunpure',
        'snpr': 'SNPR: Sunpure',
        'nestle': 'NESL: NESTLE',
        'nivea': 'NVA: Nivea',
        'godrej': 'GDJ: Godrej',
        'dabur': 'DBR: Dabur',
        'nbo': 'NBO: newbrandone',
        'google': 'GLSP: Google Pixel',
        'marico': 'MRCO: Marico',
        'mrco': 'MRCO: Marico',
        'gdjgt': 'GDJGT: Godrej GT',
        'gdjmt': 'GDJMT: Godrej MT',
        'gdj': 'GDJ: Godrej',
        'britis': 'BRITIS: Britannia IS',
        'britrw': 'BRITRW: Britannia RW',
        'nothing': 'NOTH: NOTHING',
        'nesl': 'NESL: NESTLE',
    };
    return brandMap[brandCode] || brandCode;
};

// Orders/{brand}/ configs — any FC can be paired with these brands.
// _folder tells getFilePath to resolve from test-data/Orders/{brand} instead of test-data/{fc}-{brand}.
const ORDERS_BRAND_MAP = {
    'britannia': { 'a': 'm1.csv', 'b': 'h1.csv', 'c': 'sr.csv', _folder: 'Orders/brit' },
    'britis':    { 'a': 'm1.csv', 'b': 'h1.csv', 'c': 'sr.csv', _folder: 'Orders/britis' },
    'britrw':    { 'a': 'm1.csv', 'b': 'h1.csv', 'c': 'sr.csv', _folder: 'Orders/britrw' },
    'gdj':       { 'a': 'u.csv', 'b': 'c.csv', _folder: 'Orders/gdj' },
    'gdjgt':     { 'a': 'u.csv', 'b': 'c.csv', _folder: 'Orders/gdjgt' },
    'gdjmt':     { 'a': 'u.csv', 'b': 'c.csv', _folder: 'Orders/gdjmt' },
    'hul':       { 'a': 'bl.csv', 'b': 'sr.csv', 'c': 's.csv', _folder: 'Orders/hul' },
    'huls':      { 'a': 'bl.csv', 'b': 'sr.csv', 'c': 's.csv', _folder: 'Orders/huls' },
    'nestle':    { 'a': 'ms3.csv', 'b': 'bl3.csv', 'c': 'ss3.csv', _folder: 'Orders/nesl' },
    'snpr':      { 'a': 'sunpure.csv', _folder: 'Orders/snpr' },
    'mrco':      { 'a': 'mrco.csv', _folder: 'Orders/mrco' },
};

const getFilePath = (fcCode, brandCode, fileType) => {
    const filePathMap = {
        'btml-britania': { 'a': 'm1.csv', 'b': 'h1.csv', 'c': 'sr.csv', _folder: 'Orders/brit' },
        'btml-britannia': { 'a': 'm1.csv', 'b': 'h1.csv', 'c': 'sr.csv', _folder: 'Orders/brit' },
        'peenya-nestle': { 'a': 'ms3.csv', 'b': 'bl3.csv', 'c': 'ss3.csv', _folder: 'Orders/nesl' },
        'plvm-nestle': { 'a': 'ms3.csv', 'b': 'bl3.csv', 'c': 'ss3.csv', _folder: 'Orders/nesl' },
        'btml-nivea': { 'a': 'so.csv', 'b': 'sv.csv' },
        'mdpt-godrej': { 'a': 'u.csv', 'b': 'c.csv' },
        'hrmv-dabur': { 'a': 'b1.csv', 'b': 'bs1.csv' },
        'yspr-hul': { 'a': 'bl.csv', 'b': 'sr.csv', 'c': 's.csv', _folder: 'Orders/hul' },
        'yspr-huls': { 'a': 'bl.csv', 'b': 'sr.csv', 'c': 's.csv', _folder: 'Orders/huls' },
        'btml-sunpure': { 'a': 'S1.csv' },
        'apx': { 'grn': 'GRN.csv', 'salesorder': 'salesorder.csv', 'salesreturn': 'salesreturn.csv' },
        'bndp-nbo': { 'a': 'so1.csv' },
        'bgrd-mrco': { 'a': 'mrco.csv', _folder: 'Orders/mrco' },
        'tlbl-hul': { 'a': 'bl.csv', 'b': 'sr.csv', 'c': 's.csv', _folder: 'Orders/hul' },
        'tlbl-mrco': { 'a': 'mrco.csv', _folder: 'Orders/mrco' },
        'bgrd-snpr': { 'a': 'sunpure.csv', _folder: 'Orders/snpr' },
        'byti-gdjgt': { 'a': 'u.csv', 'b': 'c.csv', _folder: 'Orders/gdjgt' },
        'byti-gdj': { 'a': 'u.csv', 'b': 'c.csv', _folder: 'Orders/gdj' }
    };

    const fcBrandKey = `${fcCode}-${brandCode}`;
    // Check fc-brand specific map first, then fall back to Orders brand map
    const entry = filePathMap[fcBrandKey] || ORDERS_BRAND_MAP[brandCode];
    const fileName = entry?.[fileType];

    if (!fileName) {
        throw new Error(`File path not found for FC: ${fcCode}, Brand: ${brandCode}, FileType: ${fileType}`);
    }

    const folderName = entry._folder || fcBrandKey;
    return path.resolve(__dirname, `../test-data/${folderName}/${fileName}`);
};

const FC_CODES = ['erhs', 'btml', 'yspr', 'peenya', 'plvm', 'mdpt', 'hrmv', 'bndp', 'bgrd', 'tlbl', 'byti', 'nmbl'];

module.exports = { getFCName, getBrandName, getFilePath, FC_CODES };
