const FinancialBot = require('../src/core/bot');
const fs = require('fs').promises;

describe('Integration Tests', () => {
    let bot;
    const testDataPath = './integration-test-data.json';

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

    test('should handle complete transaction flow', async () => {
        // Record transactions
        await bot.processMessage('/catat 15000 makan siang');
        await bot.processMessage('/catat 20000 bensin motor');
        await bot.processMessage('/catat 5000 fotocopy');

        // Check daily summary
        const dailyResponse = await bot.processMessage('pengeluaran hari ini');
        expect(dailyResponse).toContain('40.000');
        expect(dailyResponse).toContain('3');

        // Check category analysis
        const categoryResponse = await bot.processMessage('kategori terbesar');
        expect(categoryResponse).toContain('transportasi');
    });

    test('should persist data between sessions', async () => {
        // Record transaction
        await bot.processMessage('/catat 25000 beli buku');
        
        // Create new bot instance
        const newBot = new FinancialBot(testDataPath);
        await newBot.loadData();
        
        // Check if data persists
        const response = await newBot.processMessage('pengeluaran hari ini');
        expect(response).toContain('25.000');
    });

    test('should handle mixed language input', async () => {
        const responses = await Promise.all([
            bot.processMessage('Hello'),
            bot.processMessage('Halo'),
            bot.processMessage('/catat 10000 coffee'),
            bot.processMessage('/catat 15000 kopi'),
            bot.processMessage('total today'),
            bot.processMessage('pengeluaran hari ini')
        ]);

        responses.forEach(response => {
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        });
    });

    test('should validate user input properly', async () => {
        const invalidInputs = [
            '/catat abc makan',
            '/catat -5000 makan',
            '/catat 999999999 makan',
            ''
        ];

        for (const input of invalidInputs) {
            const response = await bot.processMessage(input);
            expect(response).toBeTruthy();
        }
    });

    test('should handle concurrent requests', async () => {
        const requests = [
            bot.processMessage('/catat 10000 item1'),
            bot.processMessage('/catat 20000 item2'),
            bot.processMessage('/catat 30000 item3'),
            bot.processMessage('pengeluaran hari ini')
        ];

        const responses = await Promise.all(requests);
        
        responses.forEach(response => {
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        });

        const stats = bot.getStats();
        expect(stats.totalTransactions).toBe(3);
        expect(stats.totalAmount).toBe(60000);
    });
});