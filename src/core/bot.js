const PatternMatcher = require('./patterns');
const PronounReflector = require('./reflector');
const FinancialCalculator = require('./calculator');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const database = require('./db')
const {MessageMedia} = require('whatsapp-web.js')

class FinancialBot {
    constructor(dataFilePath = './data/transactions.json') {
        this.patterns = new PatternMatcher();
        this.reflector = new PronounReflector();
        this.calculator = new FinancialCalculator();
        this.dataFilePath = dataFilePath;
        this.userData = new Map();
        this.db = new database();

        this.loadData();
    }

    async loadData() {
        try {
            await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });
            
            const data = await fs.readFile(this.dataFilePath, 'utf8');
            const transactions = JSON.parse(data);
            this.calculator.loadData(transactions);
            
            logger.info(`Loaded ${transactions.length} transactions from ${this.dataFilePath}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('Error loading data:', error);
            } else {
                logger.info('No existing data file found, starting fresh');
            }
        }
    }

    async saveData(transaction, userId) {
        try {
            await this.db.insertTransaction(transaction.amount, transaction.category, userId)
            logger.info(`Saved ${this.calculator.data.length} transactions to ${this.dataFilePath}`);
        } catch (error) {
            logger.error('Error saving data:', error);
            throw error;
        }
    }

    async processMessage(message, userId = 'default', client, chatId) {
        try {
            const matchResult = this.patterns.match(message);

            if (matchResult.category === 'export') {
                if (!client || !chatId) throw new Error('Client and chatId required for export');
                await this.handleExport(userId, client, chatId);
                return "✅ CSV berhasil dikirim!";
            }

            const response = await this.generateResponse(matchResult, userId);

            logger.info(`User ${userId}: ${message}`);
            logger.info(`Bot response: ${response.substring(0, 100)}...`);

            return response;
        } catch (error) {
            logger.error('Error processing message:', error);
            return "Maaf, terjadi kesalahan. Coba lagi ya!";
        }
    }


    async generateResponse(matchResult, userId) {
        const { category, match, originalText } = matchResult;

        switch (category) {
            case 'greeting':
                return this.patterns.getResponse('greeting');

            case 'help':
                return this.patterns.getResponse('help');

            case 'record_transaction':
                return await this.handleTransaction(match, userId);

            case 'daily_summary':
                return this.handleDailySummary(userId);

            case 'monthly_summary':
                return this.handleMonthlySummary(userId);

            case 'period_summary':
                return this.handlePeriodSummary(match, userId);

            case 'balance_check':
                return this.handleBalanceCheck(userId);

            case 'category_analysis':
                return this.calculator.getCategoryAnalysis();

            case 'unknown':
                return this.handleUnknownMessage(originalText);

            case 'statistics':
                return this.handleStats(userId)

            case 'set_budget':
                const amount = parseInt(match[1]);
                await this.db.setBudget(userId, amount);
                return `✅ Budget bulan ini diset: ${this.calculator.formatCurrency(amount)}`;

            case 'budget_alert':
                return await this.handleBudgetAlert(userId);

            default:
                return this.patterns.getResponse('unknown');
        }
    }

    async handleTransaction(match, userId) {
        const transactionData = this.patterns.extractTransactionData(match);
        
        if (!transactionData) {
            return "Format tidak valid. Contoh: /catat 15000 makan siang";
        }

        this.calculator.addTransaction(transactionData);
        await this.saveData(transactionData, userId);

        const formatted = this.calculator.formatCurrency(transactionData.amount);
        return `✅ Tercatat!\n💰 ${formatted}\n🏷️ ${transactionData.category}\n📝 ${transactionData.description}`;
    }
    async handleDailySummary(userId) {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const startDate = `${yyyy}-${mm}-${dd}`;
            const endDate = startDate;

            const transactions = await this.db.getTransactionsByDateRange(startDate, endDate, userId);
            const summary = this.calculator.computeSummary(transactions);
            return this.calculator.formatSummaryReport(summary);

        } catch (err) {
            logger.error('Error fetching daily summary from DB:', err);
            return '❌ Gagal mengambil ringkasan harian.';
        }
    }

    async handleMonthlySummary(userId) {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');

            const startDate = `${yyyy}-${mm}-01`;
            const endDate = `${yyyy}-${mm}-${new Date(yyyy, today.getMonth() + 1, 0).getDate()}`;

            const transactions = await this.db.getTransactionsByDateRange(startDate, endDate, userId);
            const summary = this.calculator.computeSummary(transactions);
            return this.calculator.formatSummaryReport(summary);
        } catch (err) {
            logger.error('Error fetching monthly summary from DB:', err);
            return '❌ Gagal mengambil ringkasan bulanan.';
        }
    }

    async handlePeriodSummary(match, userId) {
        const period = this.patterns.extractPeriod(match);

        if (!period) {
            return "Format periode tidak valid. Contoh: 'berapa pengeluaran 3 bulan terakhir?'";
        }

        try {
            const today = new Date();
            let startDate;

            switch (period.unit) {
                case 'days':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - period.amount);
                    break;
                case 'weeks':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - (period.amount * 7));
                    break;
                case 'months':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - period.amount);
                    break;
            }

            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const endDate = `${yyyy}-${mm}-${dd}`;

            const startY = startDate.getFullYear();
            const startM = String(startDate.getMonth() + 1).padStart(2, '0');
            const startD = String(startDate.getDate()).padStart(2, '0');
            const startStr = `${startY}-${startM}-${startD}`;

            const transactions = await this.db.getTransactionsByDateRange(startStr, endDate, userId);
            if (!transactions || transactions.length === 0) {
                return `Tidak ada transaksi dalam ${period.amount} ${period.unit} terakhir.`;
            }

            const summary = this.calculator.computeSummary(transactions);
            return this.calculator.formatSummaryReport(summary);
        } catch (err) {
            logger.error('Error fetching period summary from DB:', err);
            return '❌ Gagal mengambil ringkasan periode.';
        }
    }

    async handleExport(userId, client, chatId) {
        try {
            const transactions = await this.db.getAllTransactions(userId);

            if (!transactions || transactions.length === 0) {
                await client.sendMessage(chatId, '❌ Tidak ada transaksi untuk diekspor.');
                return;
            }

            // Prepare CSV
            const headers = ['ID', 'Amount', 'Category', 'Created At'];
            const rows = transactions.map(t => [t.id, t.amount, t.category, t.created_at]);
            const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');

            // Save CSV temporarily
            const fileName = `transactions_${userId}.csv`;
            const filePath = path.resolve(__dirname, '../../data', fileName);
            await fs.writeFile(filePath, csvContent, 'utf8');

            // Send CSV
            const media = await MessageMedia.fromFilePath(filePath);
            await client.sendMessage(chatId, media, { caption: '📄 Berikut CSV transaksi Anda' });

            // Delete temporary file
            await fs.unlink(filePath);

            console.log(`✅ CSV sent to user ${userId}`);
        } catch (err) {
            console.error('Error exporting CSV:', err);
            await client.sendMessage(chatId, '❌ Gagal mengekspor CSV.');
        }
    }

    handleBalanceCheck(userId) {
        const userBalance = this.getUserBalance(userId);
        const totalSpent = this.calculator.data.reduce((sum, t) => sum + t.amount, 0);
        
        let response = "💳 *Informasi Saldo*\n\n";
        response += `💸 Total pengeluaran: ${this.calculator.formatCurrency(totalSpent)}\n`;
        
        if (userBalance > 0) {
            const remaining = userBalance - totalSpent;
            response += `💰 Sisa saldo: ${this.calculator.formatCurrency(remaining)}`;
        } else {
            response += `ℹ️ Set saldo awal dengan: /saldo 1000000`;
        }

        return response;
    }

    handleUnknownMessage(originalText) {
        const empathyResponse = this.reflector.generateEmpathyResponse(originalText);
        
        if (empathyResponse) {
            return empathyResponse + "\n\n" + this.patterns.getResponse('unknown');
        }

        const reflected = this.reflector.reflect(originalText);
        return `Hmm, "${reflected}"... Saya belum mengerti. Ketik 'help' ya!`;
    }

    getUserBalance(userId) {
        return this.userData.get(userId)?.balance || 0;
    }

    setUserBalance(userId, balance) {
        const current = this.userData.get(userId) || {};
        this.userData.set(userId, { ...current, balance });
    }

    getStats() {
        return {
            totalTransactions: this.calculator.data.length,
            totalAmount: this.calculator.data.reduce((sum, t) => sum + t.amount, 0),
            categories: [...new Set(this.calculator.data.map(t => t.category))].length,
            users: this.userData.size
        };
    }

    async handleStats(userId) {
        try {
            const transactions = await this.db.getAllTransactions(userId);

            if (!transactions || transactions.length === 0) {
                return '❌ Tidak ada transaksi untuk menghitung statistik.';
            }

            // Compute first and last transaction dates
            const dates = transactions.map(t => new Date(t.created_at));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            // Number of days in the period (at least 1)
            const dayCount = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);

            // Total amount
            const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

            // Average per day
            const averagePerDay = totalAmount / dayCount;

            return `📊 Statistik Harian\n\nRata-rata pengeluaran per hari: ${this.calculator.formatCurrency(averagePerDay)}`;
        } catch (err) {
            console.error('Error generating statistics:', err);
            return '❌ Gagal menghitung statistik.';
        }
    }

    async handleBudgetAlert(userId) {
        const budget = await this.db.getBudget(userId);
        if (!budget) {
            return 'ℹ️ Anda belum mengatur budget bulan ini. Set budget dengan: /setbudget 500000';
        }

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = await this.db.getTransactionsByDateRange(
            firstDay.toISOString().split('T')[0],
            lastDay.toISOString().split('T')[0],
            userId
        );

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const percentage = Math.round((totalSpent / budget) * 100);

        let message = `💰 Budget bulan ini: ${this.calculator.formatCurrency(budget)}\n`;
        message += `📝 Total pengeluaran: ${this.calculator.formatCurrency(totalSpent)}\n`;
        message += `⚠️ Sudah ${percentage}% terpakai`;

        if (percentage >= 80) {
            message += '\n❗ Hati-hati, pengeluaran sudah hampir mencapai batas budget!';
        }

        return message;
    }

}

module.exports = FinancialBot;