const fs = require('fs');
const path = require('path');
const db = require('./dbHandler');
const { Tables } = require('../../Constants/constants');

async function getCurrentVersion() {
  const conn = await db.open();
  return new Promise((resolve, reject) => {
    conn.get(`SELECT Version FROM ${Tables.ContractVersion} ORDER BY Id DESC LIMIT 1`, [], (err, row) => {
      if (err) return reject(err);
      resolve(row ? parseFloat(row.Version) : 1.0);
    });
  });
}

async function setNewVersion(version, description) {
  const conn = await db.open();
  return new Promise((resolve, reject) => {
    conn.run(`INSERT INTO ${Tables.ContractVersion} (Version, Description) VALUES (?, ?)`, [version, description || ''], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, version });
    });
  });
}

async function writeZip(zipBuffer) {
  const zipPath = path.join('.', 'newContractData.zip');
  fs.writeFileSync(zipPath, zipBuffer);
  return zipPath;
}

async function writePostExec() {
  const script = [
    '#!/bin/sh',
    'unzip -o -d ./ "newContractData.zip"',
    'rm "newContractData.zip"'
  ].join('\n');
  fs.writeFileSync('post_exec.sh', script, { mode: 0o755 });
}

module.exports = {
  async processUpgrade({ zipBuffer, version, description }) {
    const currentVersion = await getCurrentVersion();
    if (parseFloat(version) <= parseFloat(currentVersion)) {
      throw new Error(`Incoming version (${version}) must be greater than current version (${currentVersion}).`);
    }

    await writeZip(zipBuffer);
    await writePostExec();
    const res = await setNewVersion(version, description);
    return { message: 'Upgrade accepted. Will apply on next round.', currentVersion, newVersion: version, record: res };
  }
};
