
const path = require('path');

const getFCName = (fcCode) => {
        const fcMap = {
            'erhs': 'ERHS: ERHS',
            'btml': 'BTML: BTM',
            'yspr': 'YSPR: Yeshwantpura',
            'peenya': 'PNYA: Peenya',
            'plvm': 'PLVM: Pallavaram',
            'mdpt': 'MDPT: Mehdipatnam',
            'hrmv': 'HRMV: Horamavu',
            'bndp': 'BNDP: Bhandup',
            'bgrd': 'BGRD: Begur Road',
            'tlbl': 'TLBL: Mysore Road'
        }
        return fcMap[fcCode] || fcCode;
 }

const getBrandName = (brandCode) => {
        const brandMap = {
            'britania': 'BRIT: Britania',
            'britannia': 'BRIT: Britannia',
            'apx': 'APX: APX',
            'hul': 'HUL: HUL',
            'huls': 'HULS: HUL Samadhan',
            'sunpure': 'SNPR: Sunpure',
            'nestle': 'NESL: NESTLE',
            'nivea': 'NVA: Nivea',
            'godrej': 'GDJ: Godrej',
            'dabur': 'DBR: Dabur',
            'nbo': 'NBO: newbrandone',
            'google': 'GLSP: Google Pixel',
            'marico': 'MRCO: Marico',
            'mrco': 'MRCO: Marico'
        }
        return brandMap[brandCode] || brandCode;
    }

const getFilePath = (fcCode, brandCode, fileType) => {
        const filePathMap = {
            'btml-britania': {
                'a': 'm1.csv',
                'b': 'h1.csv',
                'c': 'sr.csv'
            },
            'btml-britannia': {
                'a': 'm1.csv',
                'b': 'h1.csv',
                'c': 'sr.csv'
            },
            'peenya-nestle': {
                'a': 'ms3.csv',
                'b': 'bl3.csv',
                'c': 'ss3.csv'
            },
            'btml-nivea': {
                'a': 'so.csv',
                'b': 'sv.csv'
            },
            'mdpt-godrej': {
                'a': 'u.csv',
                'b': 'c.csv'
            },
            'hrmv-dabur': {
                'a': 'b1.csv',
                'b': 'bs1.csv'
            },
            'yspr-hul': {
                'a': 'bl.csv',
                'b': 'sr.csv',
                'c': 's.csv'
            },
            'yspr-huls': {
                'a': 'bl.csv',
                'b': 'sr.csv',
                'c': 's.csv'
            },
            'btml-sunpure': {
                'a': 'S1.csv',
            },
            'apx': {
                'grn': 'GRN.csv',
                'salesorder': 'salesorder.csv',
                'salesreturn': 'salesreturn.csv'
            },
            'bndp-nbo': {   
                'a': 'so1.csv',
            },
            'bgrd-mrco': {
                'a': 'salesmarico.csv',
                'b': 'credit.csv'
            },
            'tlbl-hul': {
                'a': 'bl.csv',
                'b': 'sr.csv',
                'c': 's.csv'
            },
            'tlbl-mrco': {
                'a': 'salesmarico.csv',
                'b': 'credit.csv'
            }
        };
        
        const fcBrandKey = `${fcCode}-${brandCode}`;
        const fileName = filePathMap[fcBrandKey]?.[fileType];
        
        if (!fileName) {
            throw new Error(`File path not found for FC: ${fcCode}, Brand: ${brandCode}, FileType: ${fileType}`);
        }
        
        return path.resolve(__dirname, `../test-data/${fcBrandKey}/${fileName}`);
    }

module.exports = { getFCName, getBrandName, getFilePath };
