class InputValidator {
    static validateAmount(amount) {
        const num = parseInt(amount);
        
        if (isNaN(num)) {
            return { valid: false, error: "Nominal harus berupa angka" };
        }
        
        if (num <= 0) {
            return { valid: false, error: "Nominal harus lebih dari 0" };
        }
        
        if (num > 10000000) {
            return { valid: false, error: "Nominal terlalu besar (max 10 juta)" };
        }
        
        return { valid: true, value: num };
    }

    static validateDescription(description) {
        if (!description || description.trim().length === 0) {
            return { valid: false, error: "Deskripsi tidak boleh kosong" };
        }
        
        if (description.length > 100) {
            return { valid: false, error: "Deskripsi terlalu panjang (max 100 karakter)" };
        }
        
        const sanitized = description.trim().replace(/[<>]/g, '');
        return { valid: true, value: sanitized };
    }

    static validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return { valid: false, error: "Pesan tidak valid" };
        }
        
        if (message.length > 500) {
            return { valid: false, error: "Pesan terlalu panjang" };
        }
        
        return { valid: true, value: message.trim() };
    }

    static validateUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            return { valid: false, error: "User ID tidak valid" };
        }
        
        return { valid: true, value: userId };
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/\s+/g, ' ');
    }
}

module.exports = InputValidator;