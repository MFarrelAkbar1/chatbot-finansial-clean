const PatternMatcher = require('./patterns');
const PronounReflector = require('./reflector');
const FinancialCalculator = require('./calculator');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class FinancialBot {
    constructor(dataFilePath = './data/transactions.json') {
        this.patterns = new PatternMatcher();
        this.reflector = new PronounReflector();
        this.calculator = new FinancialCalculator();
        this.dataFilePath = dataFilePath;
        this.userData = new Map();
        
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

    async saveData() {
        try {
            await fs.writeFile(
                this.dataFilePath, 
                JSON.stringify(this.calculator.data, null, 2)
            );
            logger.info(`Saved ${this.calculator.data.length} transactions to ${this.dataFilePath}`);
        } catch (error) {
            logger.error('Error saving data:', error);
            throw error;
        }
    }

    async processMessage(message, userId = 'default') {
        try {
            const matchResult = this.patterns.match(message);
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
                return await this.handleTransaction(match);

            case 'daily_summary':
                return this.handleDailySummary();

            case 'monthly_summary':
                return this.handleMonthlySummary();

            case 'period_summary':
                return this.handlePeriodSummary(match);

            case 'balance_check':
                return this.handleBalanceCheck(userId);

            case 'category_analysis':
                return this.calculator.getCategoryAnalysis();

            case 'unknown':
                return this.handleUnknownMessage(originalText);

            default:
                return this.patterns.getResponse('unknown');
        }
    }

    async handleTransaction(match) {
        const transactionData = this.patterns.extractTransactionData(match);
        
        if (!transactionData) {
            return "Format tidak valid. Contoh: /catat 15000 makan siang";
        }

        this.calculator.addTransaction(transactionData);
        await this.saveData();

        const formatted = this.calculator.formatCurrency(transactionData.amount);
        return `✅ Tercatat!\n💰 ${formatted}\n🏷️ ${transactionData.category}\n📝 ${transactionData.description}`;
    }

    handleDailySummary() {
        const summary = this.calculator.getDailySummary();
        return this.calculator.formatSummaryReport(summary);
    }

    handleMonthlySummary() {
        const summary = this.calculator.getMonthlySummary();
        return this.calculator.formatSummaryReport(summary);
    }

    handlePeriodSummary(match) {
        const period = this.patterns.extractPeriod(match);
        
        if (!period) {
            return "Format periode tidak valid. Contoh: 'berapa pengeluaran 3 bulan terakhir?'";
        }

        const summary = this.calculator.getPeriodSummary(period.amount, period.unit);
        return this.calculator.formatSummaryReport(summary);
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
}

module.exports = FinancialBot;