const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class TransactionDB {
    constructor(dbFilePath = path.resolve(__dirname, "../../data/database.sqlite")) {
        this.dbPath = dbFilePath;
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error("❌ Failed to connect to SQLite DB:", err.message);
            } else {
                console.log("✅ Connected to SQLite DB at", this.dbPath);
            }
        });

        this.init();
    }

    init() {
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS transactions (
                                                            whatsapp_id TEXT NOT NULL,
                                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                            amount INTEGER NOT NULL,
                                                            category TEXT NOT NULL,
                                                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                
                
            `);
            // Budgets Table
            this.db.run(`
            CREATE TABLE IF NOT EXISTS budgets (
                whatsapp_id TEXT NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                PRIMARY KEY (whatsapp_id, month, year)
            )
        `);
        });
    }

    runQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    getAll(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getOne(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Specific methods
    insertTransaction(amount, category, whatsappId) {
        return this.runQuery(
            `INSERT INTO transactions (amount, category, whatsapp_id) VALUES (?, ?, ?)`,
            [amount, category, whatsappId]
        );
    }

    getTransactionsByDateRange(startDate, endDate, whatsappId) {
        return this.getAll(
            `SELECT * FROM transactions
             WHERE date(created_at) BETWEEN date(?) AND date(?)
               AND whatsapp_id = ?
             ORDER BY created_at DESC`,
            [startDate, endDate, whatsappId]
        );
    }

    getAllTransactions(whatsappId) {
        return this.getAll(
            `SELECT * FROM transactions
             WHERE whatsapp_id = ?
             ORDER BY created_at DESC`,
            [whatsappId]
        );
    }

    async setBudget(userId, amount) {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();

        // Insert or replace
        return this.runQuery(
            `INSERT INTO budgets (whatsapp_id, month, year, amount) VALUES (?, ?, ?, ?)
         ON CONFLICT(whatsapp_id, month, year) DO UPDATE SET amount=excluded.amount`,
            [userId, month, year, amount]
        );
    }

    async getBudget(userId) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const row = await this.getOne(
            `SELECT * FROM budgets WHERE whatsapp_id = ? AND month = ? AND year = ?`,
            [userId, month, year]
        );
        return row?.amount || null;
    }
}

module.exports = TransactionDB;
