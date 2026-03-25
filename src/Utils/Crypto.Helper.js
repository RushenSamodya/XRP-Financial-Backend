function hexToUint8Array(hex) {
  if (!hex || typeof hex !== 'string') return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

module.exports = { hexToUint8Array };
