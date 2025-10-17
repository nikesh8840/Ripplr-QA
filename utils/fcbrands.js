

const getFCName = (fcCode) => {
        const fcMap = {
            'erhs': 'ERHS: ERHS',
            'btml': 'BTML: BTM',
            'yspr': 'YSPR: Yashawanthapur',
            'Peenya': 'PNYA: Peenya'
        }
        return fcMap[fcCode] || fcCode;
 }

const getBrandName = (brandCode) => {
        const brandMap = {
            'britania': 'BRIT: Britania',
            'britannia': 'BRIT: Britannia',
            'nestle': 'NESL: Nestle',
            'apx': 'APX: APX',
            'hul': 'HUL: HUL',
            'huls': 'HULS: HUL Samadhan'
        }
        return brandMap[brandCode] || brandCode;
    }

module.exports = { getFCName, getBrandName };
