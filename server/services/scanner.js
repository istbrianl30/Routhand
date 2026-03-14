const arp = require('node-arp');
const { exec } = require('child_process');
const os = require('os');

/**
 * Get the local subnet from the machine's network interfaces
 */
function getLocalSubnet() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const parts = iface.address.split('.');
                return `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }
    }
    return '192.168.1';
}

/**
 * Ping a single IP address
 */
function pingHost(ip) {
    return new Promise((resolve) => {
        const isWin = process.platform === 'win32';
        const cmd = isWin ? `ping -n 1 -w 500 ${ip}` : `ping -c 1 -W 1 ${ip}`;
        exec(cmd, (error) => {
            resolve(!error);
        });
    });
}

/**
 * Get MAC address for an IP via ARP
 */
function getMac(ip) {
    return new Promise((resolve) => {
        arp.getMAC(ip, (err, mac) => {
            if (err || !mac) {
                resolve(null);
            } else {
                resolve(mac);
            }
        });
    });
}

/**
 * Scan local network for active devices
 */
async function scan() {
    const subnet = getLocalSubnet();
    const devices = [];
    const promises = [];

    // Ping sweep the subnet
    for (let i = 1; i <= 254; i++) {
        const ip = `${subnet}.${i}`;
        promises.push(
            pingHost(ip).then(async (alive) => {
                if (alive) {
                    const mac = await getMac(ip);
                    devices.push({
                        ip,
                        mac: mac || 'unknown',
                        alive: true
                    });
                }
            })
        );
    }

    await Promise.all(promises);

    // Sort by IP
    devices.sort((a, b) => {
        const aParts = a.ip.split('.').map(Number);
        const bParts = b.ip.split('.').map(Number);
        return aParts[3] - bParts[3];
    });

    return devices;
}

module.exports = { scan };
