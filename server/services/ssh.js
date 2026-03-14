const { Client } = require('ssh2');

class SSHManager {
    constructor() {
        this.client = null;
        this.config = null;
        this.connectedSince = null;
        this._connected = false;
    }

    connect(config) {
        return new Promise((resolve, reject) => {
            this.client = new Client();
            this.config = config;

            this.client.on('ready', () => {
                this._connected = true;
                this.connectedSince = new Date().toISOString();
                console.log(`[SSH] Connected to ${config.host}`);
                resolve();
            });

            this.client.on('error', (err) => {
                this._connected = false;
                console.error(`[SSH] Error: ${err.message}`);
                reject(err);
            });

            this.client.on('close', () => {
                this._connected = false;
                console.log('[SSH] Connection closed');
            });

            this.client.connect({
                host: config.host,
                port: config.port || 22,
                username: config.username,
                password: config.password,
                readyTimeout: 10000,
                algorithms: {
                    kex: [
                        'ecdh-sha2-nistp256',
                        'ecdh-sha2-nistp384',
                        'ecdh-sha2-nistp521',
                        'diffie-hellman-group-exchange-sha256',
                        'diffie-hellman-group14-sha256',
                        'diffie-hellman-group14-sha1',
                        'diffie-hellman-group1-sha1'
                    ]
                }
            });
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
            this._connected = false;
            this.connectedSince = null;
        }
    }

    isConnected() {
        return this._connected;
    }

    exec(command) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                return reject(new Error('Not connected'));
            }
            this.client.exec(command, (err, stream) => {
                if (err) return reject(err);
                let output = '';
                stream.on('data', (data) => { output += data.toString(); });
                stream.stderr.on('data', (data) => { output += data.toString(); });
                stream.on('close', () => resolve(output));
            });
        });
    }

    shell() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                return reject(new Error('Not connected'));
            }
            this.client.shell({ term: 'xterm-256color', cols: 120, rows: 30 }, (err, stream) => {
                if (err) return reject(err);
                resolve(stream);
            });
        });
    }
}

module.exports = { SSHManager };
