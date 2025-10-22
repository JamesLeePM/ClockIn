#!/usr/bin/env node

const API_BASE_URL = 'http://192.168.0.208:3001/api';

async function testRealSMSAndEmail() {
  console.log('🧪 Testing Real SMS & Email Delivery\n');

  // Get user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('📱 SMS & Email Test Setup');
    console.log('========================\n');

    const phone = await question('Enter your phone number (e.g., +1234567890): ');
    const email = await question('Enter your email address: ');

    console.log('\n🚀 Sending OTP via SMS and Email...\n');

    // Request OTP
    const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        email: email,
        type: 'registration'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ OTP request successful!');
      console.log('\n📱 Check your phone for SMS');
      console.log('📧 Check your email for verification code');
      console.log('\n💡 If you don\'t receive them:');
      console.log('1. Check the backend server logs for the OTP code');
      console.log('2. Make sure you\'ve configured TextBelt and EmailJS');
      console.log('3. In development mode, codes are logged to console');
    } else {
      console.log('❌ OTP request failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Check if running interactively
if (require.main === module) {
  testRealSMSAndEmail();
}

module.exports = { testRealSMSAndEmail };
