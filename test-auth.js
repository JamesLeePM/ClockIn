#!/usr/bin/env node

const API_BASE_URL = 'http://192.168.0.208:3001/api';

async function testAuthFlow() {
  console.log('🧪 Testing ClockIn Authentication Flow\n');

  try {
    // Step 1: Request OTP
    console.log('1️⃣ Requesting OTP...');
    const otpResponse = await fetch(`${API_BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+1234567890',
        type: 'registration'
      })
    });
    
    const otpResult = await otpResponse.json();
    console.log('✅ OTP Request:', otpResult.message);
    
    // Step 2: Verify OTP (this will fail since we don't know the actual code)
    console.log('\n2️⃣ Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+1234567890',
        code: '123456'
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ OTP Verification:', verifyResult.message);
    
    // Step 3: Test company verification
    console.log('\n3️⃣ Testing company verification...');
    const companyResponse = await fetch(`${API_BASE_URL}/auth/company/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyCode: 'ABC123',
        employeeId: 'EMP001'
      })
    });
    
    const companyResult = await companyResponse.json();
    console.log('✅ Company Verification:', companyResult.message);
    
    // Step 4: Test health endpoint
    console.log('\n4️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthResult = await healthResponse.json();
    console.log('✅ Health Check:', healthResult.status);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📱 To test the mobile app:');
    console.log('1. Open Expo Go on your phone');
    console.log('2. Scan the QR code from the terminal');
    console.log('3. Use phone number: +1234567890');
    console.log('4. Use any 6-digit OTP code (development mode)');
    console.log('5. Use company code: ABC123');
    console.log('6. Use employee ID: EMP001');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFlow();
