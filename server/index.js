const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const sshService = require('./services/ssh');
const scannerService = require('./services/scanner');
const profilesService = require('./services/profiles');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// CORS — allow cross-origin requests (needed when frontend is on a different domain)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Serve production static build (dist/) if available
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// --- Connection State ---
let sshManager = null;

// --- API Routes ---

// Connection
app.post('/api/connect', async (req, res) => {
    try {
        const { host, port = 22, username, password } = req.body;
        if (!host || !username) {
            return res.status(400).json({ error: 'Host and username are required' });
        }
        sshManager = new sshService.SSHManager();
        await sshManager.connect({ host, port: parseInt(port), username, password });
        res.json({ success: true, message: `Connected to ${host}` });
    } catch (err) {
        sshManager = null;
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/disconnect', (req, res) => {
    if (sshManager) {
        sshManager.disconnect();
        sshManager = null;
    }
    res.json({ success: true, message: 'Disconnected' });
});

app.get('/api/status', (req, res) => {
    const connected = sshManager && sshManager.isConnected();
    res.json({
        connected,
        host: connected ? sshManager.config.host : null,
        connectedSince: connected ? sshManager.connectedSince : null
    });
});

// Execute command
app.post('/api/exec', async (req, res) => {
    if (!sshManager || !sshManager.isConnected()) {
        return res.status(400).json({ error: 'Not connected' });
    }
    try {
        const { command } = req.body;
        const output = await sshManager.exec(command);
        res.json({ success: true, output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Router info endpoints
app.get('/api/interfaces', async (req, res) => {
    if (!sshManager || !sshManager.isConnected()) {
        return res.status(400).json({ error: 'Not connected' });
    }
    try {
        const output = await sshManager.exec('ip addr show 2>/dev/null || ifconfig 2>/dev/null || show ip interface brief');
        res.json({ success: true, output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/routes', async (req, res) => {
    if (!sshManager || !sshManager.isConnected()) {
        return res.status(400).json({ error: 'Not connected' });
    }
    try {
        const output = await sshManager.exec('ip route show 2>/dev/null || netstat -rn 2>/dev/null || show ip route');
        res.json({ success: true, output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/system', async (req, res) => {
    if (!sshManager || !sshManager.isConnected()) {
        return res.status(400).json({ error: 'Not connected' });
    }
    try {
        const hostname = await sshManager.exec('hostname 2>/dev/null || echo unknown');
        const uptime = await sshManager.exec('uptime 2>/dev/null || show uptime');
        const version = await sshManager.exec('uname -a 2>/dev/null || show version');
        res.json({ success: true, hostname: hostname.trim(), uptime: uptime.trim(), version: version.trim() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Network scanner
app.get('/api/scan', async (req, res) => {
    try {
        const devices = await scannerService.scan();
        res.json({ success: true, devices });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Profiles CRUD
app.get('/api/profiles', (req, res) => {
    const profiles = profilesService.getAll();
    res.json({ success: true, profiles });
});

app.get('/api/profiles/:id', (req, res) => {
    const profile = profilesService.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true, profile });
});

app.post('/api/profiles', (req, res) => {
    const profile = profilesService.create(req.body);
    res.status(201).json({ success: true, profile });
});

app.put('/api/profiles/:id', (req, res) => {
    const profile = profilesService.update(req.params.id, req.body);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true, profile });
});

app.delete('/api/profiles/:id', (req, res) => {
    const deleted = profilesService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true });
});

// --- WebSocket for interactive terminal ---
wss.on('connection', (ws) => {
    console.log('[WS] Client connected');

    if (!sshManager || !sshManager.isConnected()) {
        ws.send(JSON.stringify({ type: 'error', data: 'SSH not connected. Please connect first.' }));
        ws.close();
        return;
    }

    sshManager.shell().then((stream) => {
        // Send SSH output to browser
        stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'data', data: data.toString('utf8') }));
        });

        stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'data', data: '\r\n[Session closed]\r\n' }));
            ws.close();
        });

        // Receive browser input, send to SSH
        ws.on('message', (msg) => {
            try {
                const parsed = JSON.parse(msg);
                if (parsed.type === 'input') {
                    stream.write(parsed.data);
                } else if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
                    stream.setWindow(parsed.rows, parsed.cols, 0, 0);
                }
            } catch {
                stream.write(msg.toString());
            }
        });

        ws.on('close', () => {
            stream.close();
            console.log('[WS] Client disconnected');
        });
    }).catch((err) => {
        ws.send(JSON.stringify({ type: 'error', data: err.message }));
        ws.close();
    });
});

// Serve index.html for any other routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// --- Start server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 Routhand server running on http://0.0.0.0:${PORT}\n`);
});
