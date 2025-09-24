

const getFCName = (fcCode) => {
        const fcMap = {
            'erhs': 'ERHS: ERHS',
            'btml': 'BTML: BTM',
            'yspr': 'YSPR: Yashawanthapur'
        }
        return fcMap[fcCode] || fcCode;
 }

const getBrandName = (brandCode) => {
        const brandMap = {
            'britania': 'BRIT: Britania',
            'apx': 'APX: APX',
            'hul': 'HUL: HUL',
            'huls': 'HULS: HUL Samadhan'
        }
        return brandMap[brandCode] || brandCode;
    }

module.exports = { getFCName, getBrandName };
