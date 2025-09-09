console.log('🧪 Testing core components...\n');

try {
    const PatternMatcher = require('./src/core/patterns');
    const patterns = new PatternMatcher();
    
    console.log('✅ PatternMatcher loaded');
    
    const testResult = patterns.match('/catat 15000 makan siang');
    console.log('✅ Pattern matching works:', testResult.category);
    
    const PronounReflector = require('./src/core/reflector');
    const reflector = new PronounReflector();
    
    console.log('✅ PronounReflector loaded');
    
    const reflected = reflector.reflect('saya bingung');
    console.log('✅ Reflection works:', reflected);
    
    const FinancialCalculator = require('./src/core/calculator');
    const calculator = new FinancialCalculator();
    
    console.log('✅ FinancialCalculator loaded');
    
    calculator.addTransaction({
        amount: 15000,
        description: 'test',
        category: 'makanan',
        timestamp: new Date()
    });
    
    const summary = calculator.getDailySummary();
    console.log('✅ Calculator works, total:', calculator.formatCurrency(summary.total));
    
    console.log('\n🎉 All core components working!');
    console.log('\nSekarang coba: npm start');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPastikan semua file src/ sudah dibuat dengan benar.');
}