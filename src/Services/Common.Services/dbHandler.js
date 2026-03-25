const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || 'computershop_finance.db';
let conn = null;

module.exports = {
  async open() {
    if (conn) return conn;
    conn = new sqlite3.Database(dbPath);
    return conn;
  }
};
