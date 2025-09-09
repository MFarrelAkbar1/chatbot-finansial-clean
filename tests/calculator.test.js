const FinancialCalculator = require('../src/core/calculator');

describe('FinancialCalculator', () => {
    let calculator;

    beforeEach(() => {
        calculator = new FinancialCalculator();
    });

    test('should add transaction correctly', () => {
        const transaction = {
            amount: 15000,
            description: 'makan siang',
            category: 'makanan',
            timestamp: new Date()
        };

        calculator.addTransaction(transaction);
        expect(calculator.data).toHaveLength(1);
        expect(calculator.data[0].amount).toBe(15000);
    });

    test('should calculate daily summary correctly', () => {
        const today = new Date();
        
        calculator.addTransaction({
            amount: 10000,
            description: 'breakfast',
            category: 'makanan',
            timestamp: today
        });

        calculator.addTransaction({
            amount: 15000,
            description: 'lunch',
            category: 'makanan', 
            timestamp: today
        });

        const summary = calculator.getDailySummary(today);
        
        expect(summary.total).toBe(25000);
        expect(summary.count).toBe(2);
        expect(summary.average).toBe(12500);
        expect(summary.topCategory).toBe('makanan');
    });

    test('should calculate monthly summary correctly', () => {
        const thisMonth = new Date();
        
        for (let i = 1; i <= 5; i++) {
            calculator.addTransaction({
                amount: 10000,
                description: `transaction ${i}`,
                category: 'makanan',
                timestamp: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), i)
            });
        }

        const summary = calculator.getMonthlySummary(thisMonth);
        
        expect(summary.total).toBe(50000);
        expect(summary.count).toBe(5);
        expect(summary.average).toBe(10000);
    });

    test('should calculate period summary correctly', () => {
        const now = new Date();
        
        calculator.addTransaction({
            amount: 20000,
            description: 'recent',
            category: 'makanan',
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });

        calculator.addTransaction({
            amount: 30000,
            description: 'old',
            category: 'transportasi',
            timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        });

        const summary = calculator.getPeriodSummary(7, 'days');
        
        expect(summary.total).toBe(20000);
        expect(summary.count).toBe(1);
    });

    test('should format currency correctly', () => {
        expect(calculator.formatCurrency(15000)).toBe('Rp15.000');
        expect(calculator.formatCurrency(1500000)).toBe('Rp1.500.000');
    });

    test('should generate category analysis', () => {
        calculator.addTransaction({
            amount: 30000,
            description: 'makan',
            category: 'makanan',
            timestamp: new Date()
        });

        calculator.addTransaction({
            amount: 10000,
            description: 'bensin',
            category: 'transportasi',
            timestamp: new Date()
        });

        const analysis = calculator.getCategoryAnalysis();
        
        expect(analysis).toContain('makanan');
        expect(analysis).toContain('transportasi');
        expect(analysis).toContain('🥇');
    });

    test('should handle empty data gracefully', () => {
        const summary = calculator.getDailySummary();
        
        expect(summary.total).toBe(0);
        expect(summary.count).toBe(0);
        expect(summary.average).toBe(0);
        expect(summary.topCategory).toBe('Tidak ada data');
    });
});