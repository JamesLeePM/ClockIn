#!/usr/bin/env node

const API_BASE_URL = 'http://192.168.0.208:3001/api';

async function getLatestOTP() {
    console.log('🔍 Getting latest OTP code...\n');

    try {
        // Request a new OTP
        const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '+1234567890',
                type: 'registration'
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ OTP request successful!');
            console.log('📱 Check the backend server logs for your OTP code');
            console.log('🔢 Look for a line like: "📱 SMS OTP for +1234567890: XXXXXX"');
            console.log('\n💡 In development mode, OTP codes are logged to console, not sent via SMS');
            console.log('\n📋 To see the OTP code:');
            console.log('1. Look at the terminal where you started the backend server');
            console.log('2. Find the line with "📱 SMS OTP for +1234567890: XXXXXX"');
            console.log('3. Use the 6-digit code (XXXXXX) in the mobile app');
        } else {
            console.log('❌ OTP request failed:', result.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n🔧 Make sure the backend server is running:');
        console.log('cd backend && node src/server.js');
    }
}

getLatestOTP();
