import mongoose, { Schema, model, models } from 'mongoose';

const StudentSchema = new Schema({
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    parentName: { type: String },
    parentPhone: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                // Basic phone validation (digits, 10-15 chars)
                return /^\d{10,15}$/.test(v);
            },
            message: (props: any) => `${props.value} is not a valid phone number!`
        }
    },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
}, { timestamps: true });

export const Student = models.Student || model('Student', StudentSchema);
