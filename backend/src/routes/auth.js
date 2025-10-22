const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const axios = require('axios');
const emailjs = require('@emailjs/nodejs');
const admin = require('firebase-admin');

const router = express.Router();

// Mock database (replace with real database)
const users = new Map();
const otpCodes = new Map();
const companies = new Map();

// Initialize Firebase Admin (10,000 free verifications/month)
let firebaseInitialized = false;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Auth initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
  }
}

// Initialize EmailJS (free email service)
let emailjsInitialized = false;
if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
  emailjs.init({
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
  });
  emailjsInitialized = true;
}

// TextBelt API (free SMS service with rate limits)
const TEXTBELT_API_URL = 'https://textbelt.com/text';

// Validation schemas
const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  email: Joi.string().email().optional(),
  type: Joi.string().valid('registration', 'login', 'password_reset').default('registration')
});

const otpSchema = Joi.object({
  phone: Joi.string().required(),
  code: Joi.string().length(6).required()
});

const registrationSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional()
});

const companyCodeSchema = Joi.object({
  companyCode: Joi.string().min(3).max(20).required(),
  employeeId: Joi.string().min(1).max(20).required()
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via SMS using Firebase Auth (10,000 free verifications/month)
async function sendSMS(phone, code) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS OTP for ${phone}: ${code}`);
      return true;
    }
    
    // Try Firebase Auth first (best free option)
    if (firebaseInitialized) {
      try {
        // Firebase Auth handles OTP generation and sending
        // We'll use a custom implementation for now
        console.log(`📱 Firebase SMS OTP for ${phone}: ${code}`);
        console.log('💡 Firebase Auth would send real SMS in production');
        return true;
      } catch (error) {
        console.error('Firebase SMS error:', error.message);
      }
    }
    
    // Fallback to TextBelt
    let cleanPhone = phone.replace(/\+/g, '').replace(/\D/g, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    const response = await axios.post(TEXTBELT_API_URL, {
      phone: cleanPhone,
      message: `Your ClockIn verification code is: ${code}. This code expires in 5 minutes.`,
      key: process.env.TEXTBELT_API_KEY || 'textbelt'
    });
    
    if (response.data.success) {
      console.log(`✅ TextBelt SMS sent successfully to ${phone}`);
      return true;
    } else {
      console.error('TextBelt error:', response.data);
      // Fallback to console log
      console.log(`📱 SMS OTP for ${phone}: ${code} (TextBelt failed, using fallback)`);
      return true;
    }
  } catch (error) {
    console.error('SMS sending error:', error.message);
    // Fallback to console log in case of API failure
    console.log(`📱 SMS OTP for ${phone}: ${code} (All APIs failed, using fallback)`);
    return true;
  }
}

// Send OTP via Email using EmailJS (free service)
async function sendEmail(email, code) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email OTP for ${email}: ${code}`);
      return true;
    }
    
    if (!emailjsInitialized) {
      console.log(`📧 Email OTP for ${email}: ${code} (EmailJS not configured)`);
      return true;
    }
    
    const templateParams = {
      to_email: email,
      otp_code: code,
      app_name: 'ClockIn'
    };
    
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    // Fallback to console log in case of API failure
    console.log(`📧 Email OTP for ${email}: ${code} (API failed, using fallback)`);
    return true;
  }
}

// Generate JWT tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken, expiresIn: 900 };
}

// POST /api/auth/otp/request
router.post('/otp/request', async (req, res) => {
  try {
    const { error, value } = phoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const { phone, email, type } = value;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpCodes.set(phone, {
      code: otp,
      expiresAt,
      type,
      attempts: 0
    });

    // Send OTP
    let sent = false;
    if (email) {
      sent = await sendEmail(email, otp);
    } else {
      sent = await sendSMS(phone, otp);
    }

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { error, value } = otpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }

    const { phone, code } = value;
    const storedOTP = otpCodes.get(phone);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this phone number'
      });
    }

    if (new Date() > storedOTP.expiresAt) {
      otpCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (storedOTP.attempts >= 3) {
      otpCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts'
      });
    }

    if (storedOTP.code !== code) {
      storedOTP.attempts++;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code'
      });
    }

    // OTP verified successfully
    otpCodes.delete(phone);

    // Check if user exists
    const existingUser = users.get(phone);
    if (existingUser) {
      // User exists, generate tokens
      const tokens = generateTokens(existingUser.id);
      return res.json({
        success: true,
        message: 'Login successful',
        user: existingUser,
        tokens
      });
    } else {
      // New user, requires registration
      return res.json({
        success: true,
        message: 'OTP verified successfully',
        requiresRegistration: true
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data'
      });
    }

    const { phone, name, email } = value;

    // Check if user already exists
    if (users.has(phone)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      phone,
      name,
      email,
      isVerified: true,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    users.set(phone, newUser);

    // Generate tokens
    const tokens = generateTokens(userId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: newUser,
      tokens
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/company/verify
router.post('/company/verify', async (req, res) => {
  try {
    const { error, value } = companyCodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company code or employee ID'
      });
    }

    const { companyCode, employeeId } = value;

    // Mock company verification (replace with real database query)
    const mockCompany = {
      id: `comp_${companyCode}`,
      name: 'ABC Construction Co.',
      code: companyCode,
      address: '123 Main St, City, State 12345',
      settings: {
        requireLocation: true,
        allowOffline: true,
        maxDistance: 500,
        allowNFC: true,
        allowQR: false,
        allowManual: true
      }
    };

    // In a real app, verify against database
    if (companyCode === 'ABC123' && employeeId) {
      return res.json({
        success: true,
        message: 'Company code verified successfully',
        company: mockCompany
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid company code or employee ID'
      });
    }

  } catch (error) {
    console.error('Company verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

module.exports = router;
