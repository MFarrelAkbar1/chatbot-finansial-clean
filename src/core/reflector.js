class PronounReflector {
    constructor() {
        this.reflections = {
            'saya': 'kamu',
            'aku': 'kamu', 
            'ku': 'mu',
            'kamu': 'saya',
            'mu': 'ku',
            'anda': 'saya',
            'gue': 'lu',
            'gw': 'lu',
            'lu': 'gue',
            'lo': 'gue',
            'saya punya': 'kamu punya',
            'aku punya': 'kamu punya',
            'kamu punya': 'saya punya',
            'punya saya': 'punya kamu',
            'punya aku': 'punya kamu',
            'punya kamu': 'punya saya',
            'milik saya': 'milik kamu',
            'milik aku': 'milik kamu', 
            'milik kamu': 'milik saya',
            'my': 'your',
            'your': 'my',
            'mine': 'yours',
            'yours': 'mine',
            'i': 'you',
            'you': 'i',
            'me': 'you',
            'am': 'are',
            'are': 'am'
        };
    }

    reflect(text) {
        if (!text) return text;
        
        let reflected = text.toLowerCase();
        
        const sortedKeys = Object.keys(this.reflections).sort((a, b) => b.length - a.length);
        
        for (const key of sortedKeys) {
            const value = this.reflections[key];
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            reflected = reflected.replace(regex, `__${value.toUpperCase()}__`);
        }
        
        reflected = reflected.replace(/__([^_]+)__/g, (match, word) => word.toLowerCase());
        
        return reflected.charAt(0).toUpperCase() + reflected.slice(1);
    }

    generateEmpathyResponse(originalMessage) {
        const empathyPatterns = [
            {
                pattern: /berapa\s+(duit|uang|dana).*(habis|keluar)/i,
                responses: [
                    "Sepertinya kamu ingin tahu total pengeluaran ya. Mari saya hitung untuk kamu!",
                    "Oke, saya akan cek berapa yang sudah kamu keluarkan.",
                    "Baik, let me check pengeluaran kamu..."
                ]
            },
            {
                pattern: /saldo|sisa/i,
                responses: [
                    "Saya akan cek sisa saldo kamu sekarang.",
                    "Mari kita lihat berapa sisa uang kamu.",
                    "Oke, checking saldo kamu..."
                ]
            },
            {
                pattern: /(boros|banyak\s+banget|mahal)/i,
                responses: [
                    "Tenang, yang penting kamu aware sama pengeluaran kamu sekarang!",
                    "It's okay, sekarang kamu sudah mulai tracking pengeluaran kan 👍",
                    "Gak papa, yang penting sekarang lebih hati-hati ya!"
                ]
            }
        ];

        for (const {pattern, responses} of empathyPatterns) {
            if (pattern.test(originalMessage)) {
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                return randomResponse;
            }
        }

        return null;
    }

    createPersonalizedResponse(template, userData = {}) {
        if (!userData.name) {
            return template;
        }

        const personalizations = {
            '{name}': userData.name,
            '{total_spent}': userData.totalSpent || '0',
            '{top_category}': userData.topCategory || 'belum ada data'
        };

        let personalized = template;
        for (const [placeholder, value] of Object.entries(personalizations)) {
            personalized = personalized.replace(new RegExp(placeholder, 'g'), value);
        }

        return personalized;
    }

    processQuestionReflection(question) {
        const questionPatterns = {
            'berapa yang sudah saya habiskan': 'berapa yang sudah kamu habiskan',
            'pengeluaran saya': 'pengeluaran kamu', 
            'uang saya': 'uang kamu',
            'saldo saya': 'saldo kamu',
            'kategori saya': 'kategori kamu'
        };

        let reflected = question;
        for (const [userPhrase, botPhrase] of Object.entries(questionPatterns)) {
            const regex = new RegExp(userPhrase, 'gi');
            reflected = reflected.replace(regex, botPhrase);
        }

        return reflected;
    }
}

module.exports = PronounReflector;