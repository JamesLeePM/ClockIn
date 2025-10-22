#!/usr/bin/env node

const API_BASE_URL = 'http://192.168.0.208:3001/api';

async function testFirebaseSMS() {
    console.log('🔥 Testing Firebase SMS Delivery\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    try {
        console.log('📱 Firebase SMS Test');
        console.log('==================\n');

        const phone = await question('Enter your phone number (e.g., +1234567890): ');

        console.log('\n🚀 Sending OTP via Firebase...\n');

        // Request OTP
        const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                type: 'registration'
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ OTP request successful!');
            console.log('\n📱 Check your phone for SMS');
            console.log('💡 If you don\'t receive it:');
            console.log('1. Check Firebase Console for errors');
            console.log('2. Verify phone number format (+1234567890)');
            console.log('3. Check backend logs for Firebase errors');
            console.log('4. Ensure Firebase Auth is enabled');
        } else {
            console.log('❌ OTP request failed:', result.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

// Check if running directly
if (require.main === module) {
    testFirebaseSMS();
}

module.exports = { testFirebaseSMS };
