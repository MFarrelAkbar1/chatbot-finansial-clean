const FinancialBot = require('../src/core/bot');
const fs = require('fs').promises;

describe('End-to-End Scenarios', () => {
    let bot;
    const testDataPath = './scenarios-test-data.json';

    beforeEach(async () => {
        bot = new FinancialBot(testDataPath);
        await bot.loadData();
    });

    afterEach(async () => {
        try {
            await fs.unlink(testDataPath);
        } catch (error) {
        }
    });

    test('Scenario: New user onboarding', async () => {
        // User greets bot
        const greeting = await bot.processMessage('Halo');
        expect(greeting).toContain('FinanceBot');

        // User asks for help
        const help = await bot.processMessage('help');
        expect(help).toContain('/catat');

        // User records first transaction
        const firstTransaction = await bot.processMessage('/catat 12000 makan warteg');
        expect(firstTransaction).toContain('✅ Tercatat');

        // User checks daily summary
        const summary = await bot.processMessage('pengeluaran hari ini');
        expect(summary).toContain('12.000');
    });

    test('Scenario: Weekly expense tracking', async () => {
        // Simulate a week of transactions
        const transactions = [
            '/catat 15000 sarapan',
            '/catat 25000 bensin',
            '/catat 8000 fotocopy',
            '/catat 20000 makan siang',
            '/catat 12000 cemilan',
            '/catat 30000 grab',
            '/catat 18000 makan malam'
        ];

        for (const transaction of transactions) {
            await bot.processMessage(transaction);
        }

        // Check various summaries
        const daily = await bot.processMessage('pengeluaran hari ini');
        const analysis = await bot.processMessage('kategori terbesar');
        
        expect(daily).toContain('128.000');
        expect(analysis).toContain('makanan');
    });

    test('Scenario: Budget awareness conversation', async () => {
        // User records expensive purchase
        await bot.processMessage('/catat 150000 beli sepatu');
        
        // User expresses concern
        const concern = await bot.processMessage('wah mahal banget saya beli ini');
        expect(concern.toLowerCase()).toContain('kamu');

        // User checks spending
        const spending = await bot.processMessage('berapa yang sudah saya habiskan?');
        expect(spending).toContain('150.000');

        // User gets category analysis
        const category = await bot.processMessage('analisis kategori');
        expect(category).toContain('lainnya');
    });

    test('Scenario: Monthly financial review', async () => {
        // Simulate month of various transactions
        const categories = ['makanan', 'transportasi', 'pendidikan', 'hiburan'];
        
        for (let day = 1; day <= 10; day++) {
            for (const category of categories) {
                let desc, amount;
                switch(category) {
                    case 'makanan':
                        desc = 'makan';
                        amount = Math.floor(Math.random() * 20000) + 10000;
                        break;
                    case 'transportasi':
                        desc = 'ojek';
                        amount = Math.floor(Math.random() * 15000) + 5000;
                        break;
                    case 'pendidikan':
                        desc = 'fotocopy';
                        amount = Math.floor(Math.random() * 10000) + 2000;
                        break;
                    case 'hiburan':
                        desc = 'nonton';
                        amount = Math.floor(Math.random() * 25000) + 15000;
                        break;
                }
                await bot.processMessage(`/catat ${amount} ${desc}`);
            }
        }

        // Monthly review
        const monthly = await bot.processMessage('laporan bulan ini');
        const analysis = await bot.processMessage('kategori terbesar');
        
        expect(monthly).toContain('Laporan bulanan');
        expect(analysis).toContain('🥇');
        
        const stats = bot.getStats();
        expect(stats.totalTransactions).toBe(40);
        expect(stats.categories).toBeGreaterThan(3);
    });

    test('Scenario: Error handling and recovery', async () => {
        // User makes mistakes
        const invalidAmount = await bot.processMessage('/catat abc makan');
        expect(invalidAmount).toContain('Format tidak valid');

        // User provides negative amount
        const negativeAmount = await bot.processMessage('/catat -5000 makan');
        expect(negativeAmount).toContain('Format tidak valid');

        // User tries unknown command
        const unknown = await bot.processMessage('blablabla random text');
        expect(unknown).toContain('belum');

        // User recovers with valid transaction
        const valid = await bot.processMessage('/catat 15000 makan siang');
        expect(valid).toContain('✅ Tercatat');
    });

    test('Scenario: Period-based analysis', async () => {
        // Add some older transactions (simulate by manipulating timestamps)
        const now = new Date();
        const transactions = [
            { amount: 10000, desc: 'old1', daysAgo: 10 },
            { amount: 15000, desc: 'old2', daysAgo: 8 },
            { amount: 20000, desc: 'recent1', daysAgo: 3 },
            { amount: 25000, desc: 'recent2', daysAgo: 1 },
            { amount: 30000, desc: 'today', daysAgo: 0 }
        ];

        for (const tx of transactions) {
            await bot.processMessage(`/catat ${tx.amount} ${tx.desc}`);
        }

        // Check period-based summary
        const periodSummary = await bot.processMessage('laporan periode');
        expect(periodSummary).toContain('Laporan periode');
    });
});