const FinancialBot = require('../src/core/bot');
const fs = require('fs').promises;
const path = require('path');

describe('FinancialBot Core', () => {
    let bot;
    const testDataPath = './test-data.json';

    beforeEach(async () => {
        bot = new FinancialBot(testDataPath);
        await bot.loadData();
    });

    afterEach(async () => {
        try {
            await fs.unlink(testDataPath);
        } catch (error) {
            // File doesn't exist, ignore
        }
    });

    test('should process greeting message', async () => {
        const response = await bot.processMessage('Halo');
        expect(response).toContain('FinanceBot');
    });

    test('should record transaction correctly', async () => {
        const response = await bot.processMessage('/catat 15000 makan siang');
        
        expect(response).toContain('✅ Tercatat!');
        expect(response).toContain('15.000');
        expect(response).toContain('makan siang');
        
        const stats = bot.getStats();
        expect(stats.totalTransactions).toBe(1);
        expect(stats.totalAmount).toBe(15000);
    });

    test('should handle invalid transaction format', async () => {
        const response = await bot.processMessage('/catat abc makan');
        expect(response).toContain('Format tidak valid');
    });

    test('should generate daily summary', async () => {
        await bot.processMessage('/catat 20000 bensin');
        await bot.processMessage('/catat 15000 makan');
        
        const response = await bot.processMessage('berapa duit yang sudah kuhabiskan hari ini?');
        
        expect(response).toContain('Laporan harian');
        expect(response).toContain('35.000');
        expect(response).toContain('2');
    });

    test('should provide help information', async () => {
        const response = await bot.processMessage('help');
        
        expect(response).toContain('FinanceBot');
        expect(response).toContain('/catat');
        expect(response).toContain('Mencatat Transaksi');
    });

    test('should handle unknown messages with reflection', async () => {
        const response = await bot.processMessage('saya bingung nih');
        expect(response.toLowerCase()).toContain('kamu');
    });
});