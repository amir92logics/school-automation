import mongoose, { Schema, model, models } from 'mongoose';

const PaymentTransactionSchema = new Schema({
    transactionRef: { type: String, required: true, unique: true },
    feeRecordId: { type: Schema.Types.ObjectId, ref: 'FeeRecord', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    amount: { type: Number, required: true },
    gateway: {
        type: String,
        enum: ['JAZZCASH', 'EASYPAISA'],
        required: true
    },
    status: {
        type: String,
        enum: ['INITIATED', 'SUCCESS', 'FAILED'],
        default: 'INITIATED',
        required: true
    },
    isSandbox: { type: Boolean, default: false },
}, { timestamps: true });

// Multi-tenant isolation and performance
PaymentTransactionSchema.index({ schoolId: 1, transactionRef: 1 });
PaymentTransactionSchema.index({ schoolId: 1, studentId: 1 });
PaymentTransactionSchema.index({ schoolId: 1, status: 1 });

export const PaymentTransaction = models.PaymentTransaction || model('PaymentTransaction', PaymentTransactionSchema);
