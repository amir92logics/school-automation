import mongoose from 'mongoose';

const FeeMessageLogSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feeRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeRecord', required: true },
    messageContent: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    status: { type: String, enum: ['SENT', 'FAILED'], default: 'SENT' }
}, { timestamps: true });

export const FeeMessageLog = mongoose.models.FeeMessageLog || mongoose.model('FeeMessageLog', FeeMessageLogSchema);
