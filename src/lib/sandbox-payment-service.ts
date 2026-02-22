import prisma from './prisma';
import crypto from 'crypto';

export class SandboxPaymentService {
    private static instance: SandboxPaymentService;

    private constructor() { }

    public static getInstance(): SandboxPaymentService {
        if (!SandboxPaymentService.instance) {
            SandboxPaymentService.instance = new SandboxPaymentService();
        }
        return SandboxPaymentService.instance;
    }

    /**
     * Generates a unique transaction reference and creates an INITIATED transaction.
     */
    public async createTransaction(params: {
        feeRecordId: string;
        studentId: string;
        schoolId: string;
        amount: number;
        gateway: 'JAZZCASH' | 'EASYPAISA';
    }) {
        const transactionRef = `TEST-${params.gateway.substring(0, 2)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        const transaction = await prisma.paymentTransaction.create({
            data: {
                ...params,
                transactionRef,
                status: 'INITIATED',
                isSandbox: true
            }
        });

        return transaction;
    }

    /**
     * Builds an internal sandbox payment link.
     */
    public buildSandboxLink(gateway: string, transactionRef: string): string {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        return `${baseUrl}/payment-simulator?gateway=${gateway.toLowerCase()}&ref=${transactionRef}`;
    }

    /**
     * Processes a simulated payment success or failure (Idempotent).
     */
    public async processSimulation(transactionRef: string, targetStatus: 'SUCCESS' | 'FAILED') {
        const transaction = await prisma.paymentTransaction.findUnique({
            where: { transactionRef }
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status !== 'INITIATED') {
            return { alreadyProcessed: true, status: transaction.status };
        }

        // Update Transaction
        await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: targetStatus }
        });

        if (targetStatus === 'SUCCESS') {
            // Update FeeRecord
            await prisma.feeRecord.update({
                where: { id: transaction.feeRecordId },
                data: { status: 'PAID' }
            });

            // Send WhatsApp Confirmation (Async)
            this.sendConfirmation(transaction).catch(err => {
                console.error('Failed to send sandbox confirmation:', err);
            });
        }

        return { success: true, status: targetStatus };
    }

    private async sendConfirmation(transaction: any) {
        // Fetch student/school info if needed, or just use transaction data
        // For simplicity, we assume we have enough basic info or can fetch it
        const confirmationMessage = `✅ Payment Success Confirmation\n\nTransaction Ref: ${transaction.transactionRef}\nAmount: Rs ${transaction.amount}\nStatus: PAID (Sandbox Mode)\n\nThank you for the payment!`;

        // Note: In a real app, you'd fetch the student's phone number here
        // For simulation, we'll log it.
        console.log(`[SANDBOX] Sending confirmation message for ${transaction.transactionRef}`);

        // In the API route, we'll have access to the student object to get the phone number
    }
}

export const sandboxPaymentService = SandboxPaymentService.getInstance();
