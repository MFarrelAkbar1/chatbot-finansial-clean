class PatternMatcher {
    constructor() {
        this.patterns = {
            greeting: [
                /^(hai|halo|hello|hi|selamat\s+(pagi|siang|sore|malam))/i,
                /^(apa\s+kabar|gimana\s+kabarnya)/i
            ],

            record_transaction: [
                /^\/catat\s+(\d+)\s+(.+)/i,
                /^catat\s+(\d+)\s+(.+)/i,
                /^(bayar|beli|buat)\s+(.+?)\s+(\d+)/i
            ],

            daily_summary: [
                /berapa\s+(duit|uang|dana)\s+.*(hari\s+ini|today)/i,
                /pengeluaran\s+hari\s+ini/i,
                /total\s+.*(hari\s+ini|today)/i
            ],

            monthly_summary: [
                /berapa\s+.*(bulan\s+ini|this\s+month)/i,
                /pengeluaran\s+bulan\s+ini/i,
                /laporan\s+bulan/i
            ],

            period_summary: [
                /berapa\s+pengeluaran\s+(\d+)\s+(hari|bulan|minggu)\s+terakhir/i,
                /laporan\s+(\d+)\s+(hari|bulan|minggu)/i,
                /summary\s+(\d+)\s+(days?|months?|weeks?)/i
            ],

            balance_check: [
                /saldo|balance/i,
                /berapa\s+(sisa|duit|uang)\s+saya/i,
                /how\s+(much|many)\s+do\s+i\s+have\s /i
            ],

            help: [
                /help|bantuan|cara\s+pakai/i,
                /apa\s+yang\s+bisa\s+kamu\s+lakukan/i,
                /^\/help$/i,
                /what\s+can\s+you\s+do/i
            ],

            category_analysis: [
                /kategori\s+terbesar/i,
                /pengeluaran\s+terbanyak\s+untuk\s+apa/i,
                /analisis\s+kategori/i
            ],

            export: [
                /^\/export$/i,
                /^export$/i,
                /export\s+(data|csv|file)/i,
                /simpan\s+(data|csv|file)/i,
                /download\s+(data|csv|file)/i
            ],

            statistics: [
                /^\/stats$/i,
                /^stats$/i,
                /^statistik$/i,
                /rata-?rata\s+per\s+hari/i,
                /average\s+per\s+day/i
            ],
            set_budget: [
                /^\/setbudget\s+(\d+)/i,
                /set\s+budget\s+(\d+)/i
            ],
            budget_alert: [
                /budget/i,
                /pengingat\s+budget/i
            ]
        };
        
        this.responses = {
            greeting: [
                "Hai! Saya FinanceBot, siap membantu mencatat keuangan kamu 💰",
                "Hello! Ada transaksi yang mau dicatat hari ini?",
                "Halo! Ketik '/help' untuk melihat cara pakai bot ini"
            ],
            
            help: `🤖 *FinanceBot - Panduan Penggunaan*

📝 *Mencatat Transaksi:*
/catat 15000 makan siang
/catat 50000 bensin motor

📊 *Cek Pengeluaran:*
"berapa duit yang sudah kuhabiskan hari ini?"
"pengeluaran bulan ini"
"laporan 3 bulan terakhir"

💰 *Fitur Lainnya:*
"saldo saya" - cek sisa uang
"kategori terbesar" - analisis pengeluaran
"bantuan" - tampilkan menu ini
"export" - memberi file untuk mencatatat pengeluaran

Contoh: /catat 20000 buku kuliah`,
            
            unknown: [
                "Maaf, saya belum mengerti. Ketik 'help' untuk melihat cara penggunaan",
                "Hmm, bisa dijelaskan lagi? Atau ketik 'bantuan' untuk panduan",
                "Saya belum paham maksudmu. Coba ketik '/help' ya"
            ]
        };
    }

    match(message) {
        const text = message.toLowerCase().trim();
        
        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return {
                        category,
                        match,
                        originalText: message
                    };
                }
            }
        }
        
        return {
            category: 'unknown',
            match: null,
            originalText: message
        };
    }

    getResponse(category, isArray = false) {
        const responses = this.responses[category];
        
        if (!responses) return this.responses.unknown[0];
        
        if (Array.isArray(responses)) {
            const randomIndex = Math.floor(Math.random() * responses.length);
            return responses[randomIndex];
        }
        
        return responses;
    }

    extractTransactionData(match) {
        if (!match || match.length < 3) return null;
        
        const amount = parseInt(match[1]);
        const description = match[2].trim();
        
        return {
            amount,
            description,
            category: this.categorizeTransaction(description),
            timestamp: new Date()
        };
    }

    categorizeTransaction(description) {
        const categories = {
            'makanan': /makan|makanan|nasi|ayam|soto|bakso|pizza|burger|snack|cemilan/i,
            'transportasi': /bensin|ojek|bus|kereta|grab|gojek|parkir|tol/i,
            'pendidikan': /buku|fotocopy|print|tugas|kuliah|kursus|les/i,
            'hiburan': /game|film|bioskop|cafe|hang\s*out|jalan/i,
            'kebutuhan': /sabun|pasta\s*gigi|shampo|detergen|tissue/i,
            'kesehatan': /obat|dokter|vitamin|masker|hand\s*sanitizer/i,
            'lainnya': /.*/
        };

        for (const [category, pattern] of Object.entries(categories)) {
            if (pattern.test(description)) {
                return category;
            }
        }
        
        return 'lainnya';
    }

    extractPeriod(match) {
        if (!match || match.length < 3) return null;
        
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        const units = {
            'hari': 'days',
            'bulan': 'months', 
            'minggu': 'weeks',
            'day': 'days',
            'days': 'days',
            'month': 'months',
            'months': 'months',
            'week': 'weeks',
            'weeks': 'weeks'
        };
        
        return {
            amount,
            unit: units[unit] || 'days'
        };
    }
}

module.exports = PatternMatcher;