require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const FinancialBot = require('../core/bot');
const logger = require('../utils/logger');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "financial-bot"
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.bot = new FinancialBot(process.env.DATA_FILE_PATH || './data/transactions.json');
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('\n📱 Scan QR code berikut dengan WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('\nBuka WhatsApp > Menu (3 titik) > WhatsApp Web > Scan QR code di atas');
            logger.info('QR Code generated for WhatsApp authentication');
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp Bot siap digunakan!');
            console.log('📱 Sekarang bisa chat dengan bot di WhatsApp');
            logger.info('WhatsApp client is ready');
        });

        this.client.on('authenticated', () => {
            console.log('🔐 WhatsApp berhasil diautentikasi');
            logger.info('WhatsApp client authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Autentikasi gagal:', msg);
            logger.error('Authentication failed:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('🔌 WhatsApp terputus:', reason);
            logger.warn('WhatsApp disconnected:', reason);
        });

        this.client.on('message_create', async (message) => {
            if (message.fromMe) return;
            
            try {
                await this.handleMessage(message);
            } catch (error) {
                logger.error('Error handling message:', error);
            }
        });
    }

    async handleMessage(message) {
        const contact = await message.getContact();
        const userId = contact.id.user;
        const userName = contact.name || contact.pushname || 'User';
        
        const messageBody = message.body?.trim();
        if (!messageBody) return;

        console.log(`📨 ${userName}: ${messageBody}`);

        try {
            const response = await this.bot.processMessage(messageBody, userId);
            await message.reply(response);
            
            console.log(`🤖 Bot: ${response.substring(0, 50)}...`);
        } catch (error) {
            console.error(`❌ Error processing message from ${userName}:`, error);
            await message.reply("Maaf, terjadi kesalahan. Coba lagi ya! 😅");
        }
    }

    async start() {
        try {
            console.log('🚀 Memulai WhatsApp Financial Bot...');
            console.log('⏳ Menginisialisasi...');
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Failed to start WhatsApp bot:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            await this.client.destroy();
            console.log('🛑 WhatsApp bot stopped');
        } catch (error) {
            console.error('Error stopping WhatsApp bot:', error);
        }
    }
}

if (require.main === module) {
    const bot = new WhatsAppBot();
    
    bot.start().catch(error => {
        console.error('Failed to start bot:', error);
        process.exit(1);
    });

    process.on('SIGINT', async () => {
        console.log('\n🛑 Menghentikan bot...');
        await bot.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Menghentikan bot...');
        await bot.stop();
        process.exit(0);
    });
}

module.exports = WhatsAppBot;