const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Allow passing URI via command line for testing
let uri = process.argv[2];

if (!uri) {
  // Fallback to loading from .env.local
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0 && key.trim() === 'MONGODB_URI') {
        uri = valueParts.join('=').trim();
      }
    });
  }
}

if (!uri) {
  console.error('Usage: node scripts/test-db.js [YOUR_MONGODB_URI]');
  process.exit(1);
}

console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':****@').split(',')[0]);

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE: Could not connect to MongoDB.');
    console.error('Error Message:', err.message);
    process.exit(1);
  });
