const sqlite3 = require('sqlite3').verbose();

module.exports = async function initDB(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS ContractVersion (
        Id INTEGER,
        Version FLOAT NOT NULL,
        Description TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("Id" AUTOINCREMENT)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Products (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        SKU TEXT UNIQUE NOT NULL,
        Name TEXT NOT NULL,
        PriceXrp FLOAT NOT NULL,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS Sales (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        SKU TEXT NOT NULL,
        Qty INTEGER NOT NULL,
        PaymentMethod TEXT NOT NULL,
        AmountXrp FLOAT DEFAULT 0,
        Customer TEXT,
        TxHash TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.close((err) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  });
};
