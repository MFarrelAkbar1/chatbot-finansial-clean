class FinancialCalculator {
    constructor() {
        this.data = [];
    }

    addTransaction(transaction) {
        this.data.push({
            ...transaction,
            id: Date.now(),
            timestamp: new Date(transaction.timestamp)
        });
    }

    loadData(transactions) {
        this.data = transactions.map(t => ({
            ...t,
            timestamp: new Date(t.timestamp)
        }));
    }

    getDailySummary(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyTransactions = this.data.filter(t => 
            t.timestamp >= startOfDay && t.timestamp <= endOfDay
        );

        return this.calculateSummary(dailyTransactions, 'harian');
    }

    getMonthlySummary(date = new Date()) {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthlyTransactions = this.data.filter(t => 
            t.timestamp >= startOfMonth && t.timestamp <= endOfMonth
        );

        return this.calculateSummary(monthlyTransactions, 'bulanan');
    }

    getPeriodSummary(amount, unit) {
        const endDate = new Date();
        const startDate = new Date();

        switch(unit) {
            case 'days':
                startDate.setDate(startDate.getDate() - amount);
                break;
            case 'weeks':
                startDate.setDate(startDate.getDate() - (amount * 7));
                break;
            case 'months':
                startDate.setMonth(startDate.getMonth() - amount);
                break;
        }

        const periodTransactions = this.data.filter(t => 
            t.timestamp >= startDate && t.timestamp <= endDate
        );

        const unitText = {
            'days': 'hari',
            'weeks': 'minggu', 
            'months': 'bulan'
        };

        return this.calculateSummary(periodTransactions, `${amount} ${unitText[unit]} terakhir`);
    }

    calculateSummary(transactions, period) {
        if (transactions.length === 0) {
            return {
                total: 0,
                count: 0,
                average: 0,
                categories: {},
                topCategory: 'Tidak ada data',
                period,
                transactions: []
            };
        }

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        const categories = {};
        
        transactions.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        const topCategory = Object.keys(categories).reduce((a, b) => 
            categories[a] > categories[b] ? a : b, Object.keys(categories)[0]
        );

        return {
            total,
            count: transactions.length,
            average: Math.round(total / transactions.length),
            categories,
            topCategory,
            period,
            transactions: transactions.slice(-5)
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatSummaryReport(summary) {
        if (summary.total === 0) {
            return `📊 *Laporan ${summary.period}*\n\n❌ Belum ada transaksi dalam periode ini.`;
        }

        let report = `📊 *Laporan ${summary.period}*\n\n`;
        report += `💰 Total Pengeluaran: ${this.formatCurrency(summary.total)}\n`;
        report += `📝 Jumlah Transaksi: ${summary.count}\n`;
        report += `📈 Rata-rata: ${this.formatCurrency(summary.average)}\n\n`;
        
        report += `🏷️ *Breakdown Kategori:*\n`;
        const sortedCategories = Object.entries(summary.categories)
            .sort(([,a], [,b]) => b - a);
            
        sortedCategories.forEach(([category, amount]) => {
            const percentage = Math.round((amount / summary.total) * 100);
            report += `• ${category}: ${this.formatCurrency(amount)} (${percentage}%)\n`;
        });

        if (summary.transactions.length > 0) {
            report += `\n📋 *Transaksi Terakhir:*\n`;
            summary.transactions.slice(-3).forEach(t => {
                const date = t.timestamp.toLocaleDateString('id-ID');
                report += `• ${date}: ${this.formatCurrency(t.amount)} - ${t.description}\n`;
            });
        }

        return report;
    }

    getCategoryAnalysis() {
        if (this.data.length === 0) {
            return "📊 Belum ada data transaksi untuk dianalisis.";
        }

        const categories = {};
        let total = 0;

        this.data.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
            total += t.amount;
        });

        let analysis = "📊 *Analisis Kategori Pengeluaran*\n\n";
        
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => b - a);

        sortedCategories.forEach(([category, amount], index) => {
            const percentage = Math.round((amount / total) * 100);
            const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "•";
            analysis += `${emoji} ${category}: ${this.formatCurrency(amount)} (${percentage}%)\n`;
        });

        const topCategory = sortedCategories[0];
        analysis += `\n💡 Kategori terbesar kamu adalah *${topCategory[0]}* dengan ${Math.round((topCategory[1] / total) * 100)}% dari total pengeluaran.`;

        return analysis;
    }

    getBalance(initialBalance = 0) {
        const totalSpent = this.data.reduce((sum, t) => sum + t.amount, 0);
        return initialBalance - totalSpent;
    }
}

module.exports = FinancialCalculator;