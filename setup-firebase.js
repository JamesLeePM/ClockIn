#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupFirebase() {
    console.log('🔥 Firebase Auth Setup for ClockIn\n');
    console.log('This will enable real SMS delivery to your phone!\n');

    try {
        // Get Firebase credentials
        const projectId = await question('Enter your Firebase Project ID: ');
        const privateKey = await question('Enter your Firebase Private Key (full key with \\n): ');
        const clientEmail = await question('Enter your Firebase Client Email: ');

        // Create .env content
        const envContent = `# ClockIn Backend Environment Variables
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://192.168.0.208:8081

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (MongoDB)
MONGODB_URI=mongodb://localhost:27017/clockin

# Firebase Auth Configuration (10,000 FREE verifications/month)
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_PRIVATE_KEY="${privateKey}"
FIREBASE_CLIENT_EMAIL=${clientEmail}

# TextBelt Configuration (Fallback - 1 SMS/day free)
TEXTBELT_API_KEY=textbelt

# EmailJS Configuration (Free Email Service)
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_TEMPLATE_ID=your-emailjs-template-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
`;

        // Write .env file
        const envPath = path.join(__dirname, 'backend', '.env');
        fs.writeFileSync(envPath, envContent);

        console.log('\n✅ Firebase configuration saved to backend/.env');
        console.log('\n🚀 Next steps:');
        console.log('1. Restart the backend server');
        console.log('2. Test SMS delivery on your phone');
        console.log('\n📱 To restart backend:');
        console.log('cd backend && pkill -f "node.*server.js" && node src/server.js');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

// Check if running directly
if (require.main === module) {
    setupFirebase();
}

module.exports = { setupFirebase };
