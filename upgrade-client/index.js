const fs = require('fs');
const path = require('path');
const ContractService = require('./contract-service');

async function main() {
  const [,, contractUrl, zipPath, privKeyHex, versionStr, description] = process.argv;
  if (!contractUrl || !zipPath || !privKeyHex || !versionStr) {
    console.error('Usage: node index.js <contractUrl> <zipFilePath> <privateKeyHex> <version> <description>');
    process.exit(1);
  }

  const version = parseFloat(versionStr);
  const zipBuffer = fs.readFileSync(path.resolve(zipPath));

  const svc = new ContractService(contractUrl, privKeyHex);
  await svc.connect();

  // Ed25519 detached signature via HotPocket client.
  const signatureHex = await svc.sign(zipBuffer);

  const payload = {
    type: 'UPGRADE',
    version,
    description: description || '',
    zipBase64: zipBuffer.toString('base64'),
    zipSignatureHex: signatureHex
  };

  const res = await svc.submit(payload);
  console.log('Upgrade response:', res);
}

main().catch(err => { console.error(err); process.exit(1); });
