const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Manually load .env.local to avoid dependency issues
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI in your environment');
    process.exit(1);
}

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['SUPER_ADMIN', 'SCHOOL_ADMIN'], required: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const adminEmail = 'admin@edusaas.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await User.create({
            name: 'System Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
        });
        console.log('Super Admin created: admin@edusaas.com / Admin@123');
    } else {
        console.log('Super Admin already exists');
    }

    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
