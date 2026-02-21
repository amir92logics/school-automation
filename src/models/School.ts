import mongoose, { Schema, model, models } from 'mongoose';

const SchoolSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    maxStudents: { type: Number, required: true },
    maxClasses: { type: Number, required: true },
    theme: {
        primaryColor: { type: String, default: '#3b82f6' },
        secondaryColor: { type: String, default: '#1e40af' },
    },
    isActive: { type: Boolean, default: true },
    jazzcashPaymentLink: { type: String, default: '' },
    easypaisaPaymentLink: { type: String, default: '' },
}, { timestamps: true });

export const School = models.School || model('School', SchoolSchema);
