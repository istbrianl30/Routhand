const scanner = require('./server/services/scanner');
scanner.scan().then(d => {
    console.log('SUCCESS:', d.length, 'devices');
    process.exit(0);
}).catch(e => {
    console.error('ERROR:', e);
    process.exit(1);
});
