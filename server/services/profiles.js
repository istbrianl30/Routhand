const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROFILES_FILE)) {
        fs.writeFileSync(PROFILES_FILE, JSON.stringify([], null, 2));
    }
}

function readProfiles() {
    ensureDataDir();
    try {
        const data = fs.readFileSync(PROFILES_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeProfiles(profiles) {
    ensureDataDir();
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

function getAll() {
    return readProfiles();
}

function getById(id) {
    const profiles = readProfiles();
    return profiles.find(p => p.id === id) || null;
}

function create(data) {
    const profiles = readProfiles();
    const profile = {
        id: crypto.randomUUID(),
        name: data.name || `${data.host}:${data.port || 22}`,
        host: data.host,
        port: data.port || 22,
        username: data.username || '',
        password: data.password || '',
        createdAt: new Date().toISOString()
    };
    profiles.push(profile);
    writeProfiles(profiles);
    return profile;
}

function update(id, data) {
    const profiles = readProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    profiles[index] = { ...profiles[index], ...data, id };
    writeProfiles(profiles);
    return profiles[index];
}

function remove(id) {
    const profiles = readProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) return false;
    profiles.splice(index, 1);
    writeProfiles(profiles);
    return true;
}

module.exports = { getAll, getById, create, update, remove };
