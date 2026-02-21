import mongoose, { Schema, model, models } from 'mongoose';

const ClassSchema = new Schema({
    name: { type: String, required: true },
    section: { type: String, required: true },
    feeAmount: { type: Number, required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
}, { timestamps: true });

export const Class = models.Class || model('Class', ClassSchema);
