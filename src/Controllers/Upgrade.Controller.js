// Controller responsible for secure contract upgrades (non-startup.js change added per request).
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const UpgradeService = require('../Services/Common.Services/Upgrade.Service');
const Response = require('../Utils/Response.Helper');
const { hexToUint8Array } = require('../Utils/Crypto.Helper');

function isMaintainer(userPubKeyHex) {
  const expected = (process.env.MAINTAINER_PUBKEY || '').toLowerCase();
  if (!expected || expected.length === 0) return false;
  return (userPubKeyHex || '').toLowerCase() === expected;
}

class UpgradeController {
  async handleUpgrade(user, payload) {
    const { zipBase64, zipSignatureHex, version, description } = payload || {};

    // Handshake Auth: verify the caller is the maintainer.
    if (!isMaintainer(user.pubkey)) {
      return Response.error('Unauthorized: caller is not the configured maintainer.');
    }

    if (!zipBase64 || !zipSignatureHex || !version) {
      return Response.error('Invalid upgrade payload: required fields missing.');
    }

    // Content Signature Auth: verify Ed25519 signature of the zip buffer.
    const zipBuffer = Buffer.from(zipBase64, 'base64');
    const signature = hexToUint8Array(zipSignatureHex);
    const pubkeyBytes = hexToUint8Array(user.pubkey);

    const verified = nacl.sign.detached.verify(zipBuffer, signature, pubkeyBytes);
    if (!verified) {
      return Response.error('Signature verification failed.');
    }

    try {
      const result = await UpgradeService.processUpgrade({ zipBuffer, version, description });
      return Response.success(result);
    } catch (err) {
      return Response.error(err.message);
    }
  }
}

module.exports = UpgradeController;
