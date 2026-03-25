const { HotPocketUserClient } = require('hotpocket-js-client');

class ContractService {
  constructor(url, privKeyHex) {
    this.url = url;
    this.privKeyHex = privKeyHex;
    this.client = null;
  }

  async connect() {
    this.client = new HotPocketUserClient(this.url, this.privKeyHex);
    await this.client.connect();
  }

  async sign(buffer) {
    // Use HotPocket client to perform Ed25519 detached signature.
    // The HotPocketUserClient exposes a sign API for Ed25519.
    return await this.client.sign(buffer);
  }

  async submit(payload) {
    const buf = Buffer.from(JSON.stringify(payload));
    const res = await this.client.submitContractInput(buf);
    return res;
  }
}

module.exports = ContractService;
