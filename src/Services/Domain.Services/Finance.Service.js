const db = require('../Common.Services/dbHandler');
const { Tables } = require('../../Constants/constants');
const xrpl = require('xrpl');

/*
  FinanceService
  - Persists sales records and generates basic financial reports.
  - Provides XRPL integration for balance queries and payments using the xrpl library.
  - Uses environment variables for XRPL RPC URL and seed (see .env). Intended for testnet use.
  - startup.js ensures write operations (including XRPL_PAY) are not executed during read-only rounds.
*/
class FinanceService {
  async recordSale({ sku, qty, payment_method, amountXrp, customer, txHash }) {
    if (!sku || !qty || !payment_method) throw new Error('sku, qty, payment_method required');
    const conn = await db.open();
    return new Promise((resolve, reject) => {
      conn.run(`INSERT INTO ${Tables.Sales} (SKU, Qty, PaymentMethod, AmountXrp, Customer, TxHash) VALUES (?, ?, ?, ?, ?, ?)`, [sku, qty, payment_method, amountXrp || 0, customer || '', txHash || ''], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, sku, qty, payment_method, amountXrp, customer, txHash });
      });
    });
  }

  async getReport({ fromDate, toDate }) {
    const conn = await db.open();
    let where = '';
    const params = [];
    if (fromDate) { where += (where ? ' AND' : ' WHERE') + ' CreatedOn >= ?'; params.push(fromDate); }
    if (toDate) { where += (where ? ' AND' : ' WHERE') + ' CreatedOn <= ?'; params.push(toDate); }
    const query = `SELECT * FROM ${Tables.Sales}${where} ORDER BY Id DESC`;
    return new Promise((resolve, reject) => {
      conn.all(query, params, (err, rows) => {
        if (err) return reject(err);
        const totalXrp = rows.reduce((sum, r) => sum + (r.AmountXrp || 0), 0);
        resolve({ count: rows.length, totalXrp, items: rows });
      });
    });
  }

  // Query XRP balance for the configured wallet.
  // Env vars: XRPL_RPC_URL (WS endpoint), XRPL_WALLET_SEED (ED25519 seed). Intended for Testnet.
  async getXrpBalance() {
    const client = new xrpl.Client(process.env.XRPL_RPC_URL || 'wss://s.altnet.rippletest.net:51233');
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed(process.env.XRPL_WALLET_SEED || '');
    const accountInfo = await client.request({ command: 'account_info', account: wallet.address, ledger_index: 'validated' });
    await client.disconnect();
    const xrpBalanceDrops = accountInfo.result.account_data.Balance;
    return { address: wallet.address, balanceXrp: parseFloat(xrpl.dropsToXrp(xrpBalanceDrops)) };
  }

  // Execute an XRP payment from the configured wallet to a destination address.
  // Note: Use with caution; ensure seed is secured and only test funds are used in non-production.
  async payXrp(destination, amountXrp) {
    const client = new xrpl.Client(process.env.XRPL_RPC_URL || 'wss://s.altnet.rippletest.net:51233');
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed(process.env.XRPL_WALLET_SEED || '');

    const tx = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Amount: xrpl.xrpToDrops(String(amountXrp)),
      Destination: destination
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const submit = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    return { result: submit.result, hash: signed.hash };
  }
}

module.exports = FinanceService;
