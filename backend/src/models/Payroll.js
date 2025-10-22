const mongoose = require('mongoose');

// Payroll Period Schema
const payrollPeriodSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'paid'],
    default: 'draft'
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalWages: {
    type: Number,
    default: 0
  },
  employees: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    hoursWorked: {
      type: Number,
      default: 0
    },
    hourlyRate: {
      type: Number,
      required: true
    },
    grossPay: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netPay: {
      type: Number,
      default: 0
    },
    timeEntries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeEntry'
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Payroll Report Schema
const payrollReportSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  reportType: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'custom'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalWages: {
    type: Number,
    default: 0
  },
  averageHoursPerEmployee: {
    type: Number,
    default: 0
  },
  averageWagePerEmployee: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Employee Payroll Settings Schema
const employeePayrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  overtimeRate: {
    type: Number,
    default: 1.5 // 1.5x regular rate
  },
  overtimeThreshold: {
    type: Number,
    default: 40 // hours per week
  },
  taxSettings: {
    federalTaxRate: {
      type: Number,
      default: 0
    },
    stateTaxRate: {
      type: Number,
      default: 0
    },
    socialSecurityRate: {
      type: Number,
      default: 0.062
    },
    medicareRate: {
      type: Number,
      default: 0.0145
    }
  },
  deductions: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['direct_deposit', 'check', 'cash'],
    default: 'direct_deposit'
  },
  bankAccount: {
    accountNumber: String,
    routingNumber: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings']
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

// Payroll Calculation Helper Functions
const calculatePayroll = (timeEntries, hourlyRate, overtimeRate = 1.5, overtimeThreshold = 40) => {
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  
  // Calculate total hours from time entries
  timeEntries.forEach(entry => {
    if (entry.type === 'checkin' && entry.checkOutTime) {
      const hours = (new Date(entry.checkOutTime) - new Date(entry.checkInTime)) / (1000 * 60 * 60);
      totalHours += hours;
    }
  });
  
  // Calculate regular and overtime hours
  if (totalHours > overtimeThreshold) {
    regularHours = overtimeThreshold;
    overtimeHours = totalHours - overtimeThreshold;
  } else {
    regularHours = totalHours;
    overtimeHours = 0;
  }
  
  // Calculate pay
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  const grossPay = regularPay + overtimePay;
  
  return {
    totalHours,
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    grossPay
  };
};

const calculateTaxes = (grossPay, taxSettings) => {
  const federalTax = grossPay * (taxSettings.federalTaxRate || 0);
  const stateTax = grossPay * (taxSettings.stateTaxRate || 0);
  const socialSecurity = grossPay * (taxSettings.socialSecurityRate || 0.062);
  const medicare = grossPay * (taxSettings.medicareRate || 0.0145);
  
  const totalTaxes = federalTax + stateTax + socialSecurity + medicare;
  
  return {
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    totalTaxes
  };
};

const calculateDeductions = (grossPay, deductions) => {
  let totalDeductions = 0;
  
  deductions.forEach(deduction => {
    if (deduction.isActive) {
      if (deduction.type === 'fixed') {
        totalDeductions += deduction.amount;
      } else if (deduction.type === 'percentage') {
        totalDeductions += grossPay * (deduction.amount / 100);
      }
    }
  });
  
  return totalDeductions;
};

module.exports = {
  PayrollPeriod: mongoose.model('PayrollPeriod', payrollPeriodSchema),
  PayrollReport: mongoose.model('PayrollReport', payrollReportSchema),
  EmployeePayroll: mongoose.model('EmployeePayroll', employeePayrollSchema),
  calculatePayroll,
  calculateTaxes,
  calculateDeductions
};
