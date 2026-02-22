const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Manually load .env or .env.local to avoid dependency issues
const envs = ['.env', '.env.local'];
envs.forEach(envFile => {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
        console.log(`Loading environment from ${envFile}`);
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const k = key.trim();
                const v = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[k]) {
                    process.env[k] = v;
                }
            }
        });
    }
});

async function seed() {
    console.log('Starting seed process with Driver Adapter...');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const adminEmail = 'admin@edusaas.com';
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await prisma.user.create({
                data: {
                    name: 'System Super Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                }
            });
            console.log('✅ Super Admin created: admin@edusaas.com / Admin@123');
        } else {
            console.log('ℹ️ Super Admin already exists');
        }
    } catch (err) {
        console.error('Seed execution error:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    }
}

seed().catch(async (err) => {
    console.error('Seed initialization error:', err);
    process.exit(1);
});
