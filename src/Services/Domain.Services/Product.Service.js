const db = require('../Common.Services/dbHandler');
const { Tables } = require('../../Constants/constants');

class ProductService {
  async create({ sku, name, priceXrp }) {
    if (!sku || !name || priceXrp == null) throw new Error('sku, name, priceXrp required');
    const conn = await db.open();
    return new Promise((resolve, reject) => {
      conn.run(`INSERT INTO ${Tables.Products} (SKU, Name, PriceXrp) VALUES (?, ?, ?)`, [sku, name, priceXrp], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, sku, name, priceXrp });
      });
    });
  }

  async getBySku(sku) {
    const conn = await db.open();
    return new Promise((resolve, reject) => {
      conn.get(`SELECT * FROM ${Tables.Products} WHERE SKU = ?`, [sku], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

module.exports = ProductService;
