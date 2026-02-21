import { Client, LocalAuth, MessageContent } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Server as SocketServer } from 'socket.io';

const logToFile = (message: string) => {
    const logPath = path.join(process.cwd(), 'whatsapp-debug.log');
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (err) {
        console.error('Failed to write to log file', err);
    }
};

class WhatsAppService {
    private static instance: WhatsAppService;
    private clients: Map<string, Client> = new Map();
    private io: SocketServer | null = null;

    private constructor() {
        logToFile('WhatsAppService instance created');
    }

    public static getInstance(): WhatsAppService {
        if (!(global as any).whatsappService) {
            (global as any).whatsappService = new WhatsAppService();
        }
        return (global as any).whatsappService;
    }

    public setIo(io: SocketServer) {
        this.io = io;
        logToFile('Socket.io server instance attached to WhatsAppService');

        // Remove existing listeners to avoid duplicates on reload
        this.io.removeAllListeners('connection');

        this.io.on('connection', (socket) => {
            logToFile(`Socket connected: ${socket.id}`);
            const schoolId = socket.handshake.query.schoolId as string;
            if (schoolId) {
                socket.join(schoolId);
                logToFile(`Socket ${socket.id} joined room: ${schoolId}`);

                // Immediately send status if already connected
                this.getStatus(schoolId).then(status => {
                    socket.emit('whatsapp-status', { status });
                });
            } else {
                logToFile(`Socket ${socket.id} connected without schoolId`);
            }

            socket.on('disconnect', (reason) => {
                logToFile(`Socket ${socket.id} disconnected. Reason: ${reason}`);
            });
        });
    }

    public async initializeClient(schoolId: string) {
        if (this.clients.has(schoolId)) {
            logToFile(`Client already exists for school: ${schoolId}`);
            return this.clients.get(schoolId);
        }

        logToFile(`Initializing new WhatsApp client for school: ${schoolId}`);
        const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', schoolId);

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
            logToFile(`Created session directory: ${sessionPath}`);
        }

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: schoolId,
                dataPath: path.join(process.cwd(), 'whatsapp-sessions')
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

        client.on('qr', async (qr) => {
            logToFile(`QR RECEIVED for school: ${schoolId}`);
            try {
                const qrDataURL = await qrcode.toDataURL(qr);
                if (this.io) {
                    this.io.to(schoolId).emit('whatsapp-qr', { qr: qrDataURL });
                    logToFile(`QR EMITTED via socket to room: ${schoolId}`);
                } else {
                    logToFile(`CRITICAL: Cannot emit QR, io is NULL for school: ${schoolId}`);
                }
            } catch (err) {
                logToFile(`Error generating QR DataURL: ${err}`);
            }
        });

        client.on('ready', () => {
            logToFile(`WhatsApp client READY for school: ${schoolId}`);
            if (this.io) {
                this.io.to(schoolId).emit('whatsapp-status', { status: 'CONNECTED' });
            }
        });

        client.on('authenticated', () => {
            logToFile(`WhatsApp client AUTHENTICATED for school: ${schoolId}`);
        });

        client.on('auth_failure', (msg) => {
            logToFile(`WhatsApp AUTH FAILURE for school ${schoolId}: ${msg}`);
            if (this.io) {
                this.io.to(schoolId).emit('whatsapp-status', { status: 'AUTH_FAILURE', message: msg });
            }
        });

        client.on('disconnected', (reason) => {
            logToFile(`WhatsApp client DISCONNECTED for school ${schoolId}: ${reason}`);
            this.clients.delete(schoolId);
            if (this.io) {
                this.io.to(schoolId).emit('whatsapp-status', { status: 'DISCONNECTED', reason });
            }
        });

        try {
            logToFile(`Calling client.initialize() for ${schoolId}`);
            await client.initialize();
            this.clients.set(schoolId, client);
            logToFile(`client.initialize() SUCCESS for ${schoolId}`);
        } catch (error) {
            logToFile(`client.initialize() FAILED for ${schoolId}: ${error}`);
            if (this.io) {
                this.io.to(schoolId).emit('whatsapp-status', { status: 'ERROR', message: 'Initialization failed' });
            }
        }

        return client;
    }

    public getClient(schoolId: string): Client | undefined {
        return this.clients.get(schoolId);
    }

    public async getStatus(schoolId: string): Promise<string> {
        const client = this.clients.get(schoolId);
        if (!client) return 'DISCONNECTED';
        try {
            const state = await client.getState();
            return state === 'CONNECTED' ? 'CONNECTED' : 'NOT_CONNECTED';
        } catch (e) {
            logToFile(`Error getting state for ${schoolId}: ${e}`);
            return 'NOT_CONNECTED';
        }
    }

    public async logout(schoolId: string) {
        const client = this.clients.get(schoolId);
        if (client) {
            try {
                await client.logout();
                await client.destroy();
                this.clients.delete(schoolId);

                // Clean up session files
                const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', `session-${schoolId}`);
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                logToFile(`Logged out and cleaned up for ${schoolId}`);
            } catch (error) {
                logToFile(`Error during logout for ${schoolId}: ${error}`);
            }
        } else {
            logToFile(`No client found to logout for ${schoolId}`);
        }
    }

    public async sendMessage(schoolId: string, phone: string, message: string) {
        const client = this.clients.get(schoolId);
        if (!client) {
            logToFile(`Attempted to send message for ${schoolId} but client not connected.`);
            throw new Error('WhatsApp not connected');
        }

        // Format phone number (append @c.us if not present)
        const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;

        try {
            await client.sendMessage(formattedPhone, message);
            logToFile(`Message sent successfully for ${schoolId} to ${formattedPhone}`);
            return { success: true };
        } catch (error: any) {
            logToFile(`Error sending message for ${schoolId} to ${formattedPhone}: ${error.message}`);
            throw new Error(`WhatsApp Send Error: ${error.message}`);
        }
    }
}

// Global variable for singleton in dev mode
const service = WhatsAppService.getInstance();
export const whatsappService = service;
export default service;
