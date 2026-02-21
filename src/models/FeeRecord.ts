import mongoose, { Schema, model, models } from 'mongoose';

const FeeRecordSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'PAID'],
        default: 'PENDING',
        required: true
    },
    dueDate: { type: Date, required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
}, { timestamps: true });

// Index for multi-tenant isolation and performance
FeeRecordSchema.index({ schoolId: 1, studentId: 1 });
FeeRecordSchema.index({ schoolId: 1, classId: 1 });
FeeRecordSchema.index({ schoolId: 1, status: 1 });

export const FeeRecord = models.FeeRecord || model('FeeRecord', FeeRecordSchema);
