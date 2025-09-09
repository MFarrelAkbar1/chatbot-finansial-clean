const PatternMatcher = require('../src/core/patterns');

describe('PatternMatcher', () => {
    let matcher;

    beforeEach(() => {
        matcher = new PatternMatcher();
    });

    test('should match greeting patterns', () => {
        const greetings = ['Halo', 'hai', 'Hello', 'selamat pagi'];
        
        greetings.forEach(greeting => {
            const result = matcher.match(greeting);
            expect(result.category).toBe('greeting');
        });
    });

    test('should match transaction recording patterns', () => {
        const transactions = [
            '/catat 15000 makan siang',
            'catat 20000 bensin motor',
            'bayar makan 12000'
        ];
        
        transactions.forEach(transaction => {
            const result = matcher.match(transaction);
            expect(result.category).toBe('record_transaction');
        });
    });

    test('should extract transaction data correctly', () => {
        const result = matcher.match('/catat 25000 beli buku');
        const data = matcher.extractTransactionData(result.match);
        
        expect(data.amount).toBe(25000);
        expect(data.description).toBe('beli buku');
        expect(data.category).toBe('pendidikan');
    });

    test('should categorize transactions correctly', () => {
        const testCases = [
            { desc: 'makan ayam', expected: 'makanan' },
            { desc: 'bensin motor', expected: 'transportasi' },
            { desc: 'beli buku', expected: 'pendidikan' },
            { desc: 'nonton film', expected: 'hiburan' },
            { desc: 'sabun mandi', expected: 'kebutuhan' }
        ];

        testCases.forEach(({ desc, expected }) => {
            const category = matcher.categorizeTransaction(desc);
            expect(category).toBe(expected);
        });
    });

    test('should match daily summary patterns', () => {
        const queries = [
            'berapa duit yang sudah kuhabiskan hari ini?',
            'pengeluaran hari ini',
            'total hari ini'
        ];
        
        queries.forEach(query => {
            const result = matcher.match(query);
            expect(result.category).toBe('daily_summary');
        });
    });

    test('should extract period correctly', () => {
        const result = matcher.match('berapa pengeluaran 3 bulan terakhir?');
        const period = matcher.extractPeriod(result.match);
        
        expect(period.amount).toBe(3);
        expect(period.unit).toBe('months');
    });
});