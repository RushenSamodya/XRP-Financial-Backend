module.exports = {
  dbPath: process.env.DB_PATH || 'computershop_finance.db',
  maintainerPubKey: process.env.MAINTAINER_PUBKEY || '',
  xrplRpcUrl: process.env.XRPL_RPC_URL || 'wss://s.altnet.rippletest.net:51233',
  xrplSeed: process.env.XRPL_WALLET_SEED || ''
};
