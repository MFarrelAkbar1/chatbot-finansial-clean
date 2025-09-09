const PronounReflector = require('../src/core/reflector');

describe('PronounReflector', () => {
    let reflector;

    beforeEach(() => {
        reflector = new PronounReflector();
    });

    test('should reflect Indonesian pronouns correctly', () => {
        const testCases = [
            { input: 'saya bingung', expected: 'Kamu bingung' },
            { input: 'aku tidak mengerti', expected: 'Kamu tidak mengerti' },
            { input: 'uang saya habis', expected: 'Uang kamu habis' },
            { input: 'kamu tahu tidak?', expected: 'Saya tahu tidak?' }
        ];

        testCases.forEach(({ input, expected }) => {
            const result = reflector.reflect(input);
            expect(result).toBe(expected);
        });
    });

    test('should reflect English pronouns correctly', () => {
        const testCases = [
            { input: 'my money is gone', expected: 'Your money is gone' },
            { input: 'you are helpful', expected: 'I are helpful' },
            { input: 'i am confused', expected: 'You am confused' }
        ];

        testCases.forEach(({ input, expected }) => {
            const result = reflector.reflect(input);
            expect(result).toBe(expected);
        });
    });

    test('should generate empathy responses', () => {
        const testCases = [
            'berapa duit yang sudah habis?',
            'saldo saya berapa?',
            'wah boros banget saya'
        ];

        testCases.forEach(message => {
            const response = reflector.generateEmpathyResponse(message);
            expect(response).toBeTruthy();
            expect(typeof response).toBe('string');
        });
    });

    test('should process question reflection', () => {
        const result = reflector.processQuestionReflection('pengeluaran saya hari ini');
        expect(result).toContain('pengeluaran kamu');
    });

    test('should create personalized responses', () => {
        const template = 'Halo {name}, total pengeluaran kamu {total_spent}';
        const userData = { name: 'Budi', totalSpent: '50000' };
        
        const result = reflector.createPersonalizedResponse(template, userData);
        expect(result).toBe('Halo Budi, total pengeluaran kamu 50000');
    });

    test('should handle empty or null input', () => {
        expect(reflector.reflect('')).toBe('');
        expect(reflector.reflect(null)).toBe(null);
        expect(reflector.reflect(undefined)).toBe(undefined);
    });
});