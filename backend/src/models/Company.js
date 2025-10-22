const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'US'
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  companyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 10
  },
  settings: {
    allowNFC: {
      type: Boolean,
      default: true
    },
    allowQR: {
      type: Boolean,
      default: false
    },
    allowManual: {
      type: Boolean,
      default: true
    },
    requireLocation: {
      type: Boolean,
      default: true
    },
    locationRadius: {
      type: Number,
      default: 100 // meters
    },
    overtimeThreshold: {
      type: Number,
      default: 40 // hours per week
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    maxEmployees: {
      type: Number,
      default: 10
    },
    features: {
      payroll: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      nfc: { type: Boolean, default: true },
      gps: { type: Boolean, default: true }
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    nextBillingDate: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
companySchema.index({ companyCode: 1 });
companySchema.index({ email: 1 });
companySchema.index({ isActive: 1 });

// Generate company code
companySchema.statics.generateCompanyCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pre-save middleware to generate company code if not provided
companySchema.pre('save', function(next) {
  if (!this.companyCode) {
    this.companyCode = this.constructor.generateCompanyCode();
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Company', companySchema);
