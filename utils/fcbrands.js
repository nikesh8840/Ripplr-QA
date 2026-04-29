
const path = require('path');

// Source: cdms-preprod.ripplr.in — POST /api/champ/fc/list  (75 FCs)
// Keys are lowercase fc codes; values are 'CODE: Display Name' as the UI expects.
const FC_NAME_MAP = {
    'byti':     'BYTI: Byrathi',
    'btml':     'BTML: BTM',
    'yspr':     'YSPR: Yeshwantpura',
    'rplr':     'RPLR: RIPPLR',
    'rplc':     'RPLC: Hsr TechIt',
    'cnmd':     'CNMD: Chennai Maduravoyal',
    'tlbl':     'TLBL: Mysore Road',
    'prsg':     'PRSG: Phursungi',
    'omr':      'OMR: OMR',
    'mdpt':     'MDPT: Mehdipatnam',
    'vjvd':     'VJVD: Vijayawada',
    'cmbt':     'CMBT: Coimbatore',
    'mspt':     'MSPT: Moosapet',
    'pncy':     'PNCY: Pondicherry',
    'plvm':     'PLVM: Pallavaram',
    'ckbp':     'CKBP: Chikkaballapur',
    'dlmu':     'DLMU: Delhi',
    'bndp':     'BNDP: Bhandup',
    'hsra':     'HSRA: Hosur',
    'gbdr':     'GBDR: Gouribidanur',
    'gmpd':     'GMPD: Gummidipundi',
    'gndy':     'GNDY: Guindy',
    'tmkr':     'TMKR: Tumkur',
    'mkli':     'MKLI: Makali',
    'mdli':     'MDLI: MANDOLI',
    'klar':     'KLAR: KOLAR',
    'kopl':     'KOPL: KOPPAL',
    'bdar':     'BDAR: BIDAR',
    'racr':     'RACR: RAICHUR',
    'bjpa':     'BJPA: VIJAYAPURA',
    'glbg':     'GLBG: GULBARGA',
    'shma':     'SHMA: SHIMOGA',
    'dvge':     'DVGE: DAVANGERE',
    'kmpl':     'KMPL: KOMPALLY',
    'saem':     'SAEM: SALEM',
    'udmt':     'UDMT: UDUMALPET',
    'sepm':     'SEPM: SELVAPURAM',
    'mdri':     'MDRI: MADURAI',
    'akla':     'AKLA: AKOLA',
    'amti':     'AMTI: AMRAVATI',
    'beed':     'BEED: BEED',
    'buna':     'BUNA: BULDHANA',
    'ooty':     'OOTY: OOTY',
    'kulu':     'KULU: KUDLU GATE',
    'sltp':     'SLTP: Sultanpur',
    'dhad':     'DHAD: DHARWAD',
    'sing':     'SING: SINGASANDRA',
    'pune':     'PUNE: PUNE',
    'cdpr':     'CDPR: Chandrapur',
    'ckhi':     'CKHI: Chikhali',
    'wshm':     'WSHM: Washim',
    'sidg':     'SIDG: Sindhudurg',
    'gdhl':     'GDHL: Gadchiroli',
    'svki':     'SVKI: Sivakasi',
    'rmpm':     'RMPM: Ramanathapuram',
    'suka':     'SUKA: Soukya',
    'nmbl':     'NMBL: Noombal',
    'myrd':     'MYRD: Mysore Roa',
    'wagl':     'WAGL: Warangal',
    'ksnd':     'KSND: Kesnand',
    'lmpi':     'LMPI: Lingampalli',
    'erhs':     'ERHS: E Ripplr HosaRoad',
    'ermk':     'ERMK: E Ripplr Makali',
    'bgrd':     'BGRD: Begur Road',
    'byod':     'BYOD: Byrathi Old Dabur',
    'crmp':     'CRMP: Chromepet',
    'tc1':      'TC1: Test Demo FC',
    'testf':    'TestF: Test fc',
    'hsr':      'HSR: HSR',
    'elet':     'ELET: Elec_Testing',
    'grnt':     'GRNT: GRNT',
    'fcs1':     'FCS1: SUPPORT FC',
    'erwd':     'ERWD: E RIPPLR SOUTH WEST DELHI',
    'tclp':     'TCLP: testnisda',
    'rpp-fc-1': 'RPP-FC-1: Ripplr Domlur-FC',
    // Aliases / legacy (not currently in /api/champ/fc/list but referenced in older tests / getFilePath map)
    'peenya':   'PNYA: Peenya',
    'pnya':     'PNYA: Peenya',
    'hrmv':     'HRMV: Horamavu',
};

const getFCName = (fcCode) => FC_NAME_MAP[fcCode] || fcCode;

// Source: cdms-preprod.ripplr.in — POST /api/champ/brand/list_v2 + brands referenced via FC.Brands
// Keys are lowercase brand codes; existing aliases (brit/britannia/britania, dbr/dabur, etc.) preserved.
const BRAND_NAME_MAP = {
    // Active CDMS brands
    'dbr':      'DBR: Dabur',
    'gdjmt':    'GDJMT: Godrej MT',
    'gdjgt':    'GDJGT: Godrej GT',
    'brit':     'BRIT: Britannia',
    'kbc':      'KBC: Kimberly Clark',
    'rkthl':    'RKTHL: Ricket Health',
    'tata':     'TATA: TATA',
    'nva':      'NVA: Nivea',
    'rpp':      'RPP: RIPPLR TechIt Two',
    'hul':      'HUL: HUL',
    'itc':      'ITC: ITC',
    'loreal':   'LOREAL: LOREAL',
    'gdj':      'GDJ: Godrej',
    'clgt':     'CLGT: Colgate',
    'rb':       'RB: Reckitt Benckiser',
    'kelgs':    'KELGS: Kelloggs',
    'nesl':     'NESL: NESTLE',
    'gldp':     'GLDP: Gold Drop',
    'mdlz':     'MDLZ: Mondelez',
    'wpro':     'WPRO: WIPRO',
    'elec':     'ELEC: Electronic',
    'nab':      'NAB: New Age Brand',
    'hulhts':   'HULHTS: Hindustan Unilever Limited',
    'snpr':     'SNPR: Sunpure',
    'britmt':   'BRITMT: Britannia MT',
    'britrw':   'BRITRW: Britannia Railway',
    'britis':   'BRITIS: Britannia Institution',
    'maea':     'MAEA: Mamaearth',
    'mrco':     'MRCO: Marico',
    'snprgt':   'SNPRGT: Sunpure GT',
    'glsp':     'GLSP: Google Pixel',
    'hisn':     'HISN: Hisense',
    'nois':     'NOIS: Noise',
    'poc':      'POC: POCO',
    'pasc':     'PASC: Panasonic',
    'acer':     'ACER: ACER',
    'ooge':     'OOGE: OOGE',
    'sams':     'SAMS: SAMSUNG',
    'itel':     'ITEL: ITEL',
    'noth':     'NOTH: NOTHING',
    'cmf':      'CMF: CMF',
    'huls':     'HULS: HUL SAMADHAN',
    'apx':      'APX: APX',
    'tc1':      'TC1: Test Brand',
    'tc-brd-1': 'TC-BRD-1: Test New Age Brand',
    'tc-brd-2': 'TC-BRD-2: Test Cash & Carry Brand',
    'tc-brd-3': 'TC-BRD-3: Test Electrnics Brand',
    'tc-brd-4': 'TC-BRD-4: Test General Marchandise Brand',
    'rpb2':     'RPB2: SOWELL',
    'rpb3':     'RPB3: DEONICA',
    'rpb5':     'RPB5: QUAD',
    'rpb6':     'RPB6: Golddrop',
    'tcbrd':    'TCBRD: jkk',
    'grnb':     'GRNB: GRNB',
    'brds2':    'BRDS2: SUPONE',
    'brds3':    'BRDS3: SUPTWO',
    'eripplr':  'Eripplr: Eripplr',
    'hp':       'HP: HP',
    // Aliases used in folder names / legacy
    'britania':  'BRIT: Britannia',
    'britannia': 'BRIT: Britannia',
    'sunpure':   'SNPR: Sunpure',
    'nestle':    'NESL: NESTLE',
    'nivea':     'NVA: Nivea',
    'godrej':    'GDJ: Godrej',
    'dabur':     'DBR: Dabur',
    'nbo':       'NBO: newbrandone',
    'google':    'GLSP: Google Pixel',
    'marico':    'MRCO: Marico',
    'nothing':   'NOTH: NOTHING',
    'samsung':   'SAMS: SAMSUNG',
};

const getBrandName = (brandCode) => BRAND_NAME_MAP[brandCode] || brandCode;

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

// All 75 FC codes (lowercase) from CDMS preprod /api/champ/fc/list as of 2026-04-27
const FC_CODES = [
    'byti','btml','yspr','rplr','rplc','cnmd','tlbl','prsg','omr','mdpt',
    'vjvd','cmbt','mspt','pncy','plvm','ckbp','dlmu','bndp','hsra','gbdr',
    'gmpd','gndy','tmkr','mkli','mdli','klar','kopl','bdar','racr','bjpa',
    'glbg','shma','dvge','kmpl','saem','udmt','sepm','mdri','akla','amti',
    'beed','buna','ooty','kulu','sltp','dhad','sing','pune','cdpr','ckhi',
    'wshm','sidg','gdhl','svki','rmpm','suka','nmbl','myrd','wagl','ksnd',
    'lmpi','erhs','ermk','bgrd','byod','crmp','tc1','testf','hsr','elet',
    'grnt','fcs1','erwd','tclp','rpp-fc-1'
];

// All brand codes (lowercase) seen in CDMS preprod (FC.Brands ∪ /brand/list_v2)
const BRAND_CODES = [
    'dbr','gdjmt','gdjgt','brit','kbc','rkthl','tata','nva','rpp','hul',
    'itc','loreal','gdj','clgt','rb','kelgs','nesl','gldp','mdlz','wpro',
    'elec','nab','hulhts','snpr','britmt','britrw','britis','maea','mrco','snprgt',
    'glsp','hisn','nois','poc','pasc','acer','ooge','sams','itel','noth',
    'cmf','huls','apx','tc1','tc-brd-1','tc-brd-2','tc-brd-3','tc-brd-4','rpb2','rpb3',
    'rpb5','rpb6','tcbrd','grnb','brds2','brds3','eripplr','hp'
];

module.exports = {
    getFCName, getBrandName, getFilePath,
    FC_CODES, BRAND_CODES,
    FC_NAME_MAP, BRAND_NAME_MAP
};
