const express = require('express');
const Joi = require('joi');
const {
  PayrollPeriod,
  PayrollReport,
  EmployeePayroll,
  calculatePayroll,
  calculateTaxes,
  calculateDeductions
} = require('../models/Payroll');
const { TimeEntry } = require('../models/TimeEntry');
const { User } = require('../models/User');
const { Company } = require('../models/Company');

const router = express.Router();

// Validation schemas
const payrollPeriodSchema = Joi.object({
  companyId: Joi.string().required(),
  periodStart: Joi.date().required(),
  periodEnd: Joi.date().required()
});

const employeePayrollSchema = Joi.object({
  employeeId: Joi.string().required(),
  hourlyRate: Joi.number().positive().required(),
  overtimeRate: Joi.number().positive().default(1.5),
  overtimeThreshold: Joi.number().positive().default(40)
});

// Generate payroll for a period
router.post('/generate', async (req, res) => {
  try {
    const { error, value } = payrollPeriodSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { companyId, periodStart, periodEnd } = value;

    // Get all employees for the company
    const employees = await User.find({
      companyId: companyId,
      role: 'employee',
      isActive: true
    });

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found for this company'
      });
    }

    // Get time entries for the period
    const timeEntries = await TimeEntry.find({
      companyId: companyId,
      checkInTime: { $gte: periodStart, $lte: periodEnd }
    });

    // Calculate payroll for each employee
    const payrollData = [];
    let totalHours = 0;
    let totalWages = 0;

    for (const employee of employees) {
      // Get employee payroll settings
      const payrollSettings = await EmployeePayroll.findOne({
        employeeId: employee._id
      });

      if (!payrollSettings) {
        console.warn(`No payroll settings found for employee ${employee._id}`);
        continue;
      }

      // Get employee's time entries for the period
      const employeeTimeEntries = timeEntries.filter(
        entry => entry.employeeId.toString() === employee._id.toString()
      );

      // Calculate payroll
      const payroll = calculatePayroll(
        employeeTimeEntries,
        payrollSettings.hourlyRate,
        payrollSettings.overtimeRate,
        payrollSettings.overtimeThreshold
      );

      // Calculate taxes
      const taxes = calculateTaxes(payroll.grossPay, payrollSettings.taxSettings);

      // Calculate deductions
      const deductions = calculateDeductions(payroll.grossPay, payrollSettings.deductions);

      // Calculate net pay
      const netPay = payroll.grossPay - taxes.totalTaxes - deductions;

      const employeePayroll = {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        hoursWorked: payroll.totalHours,
        hourlyRate: payrollSettings.hourlyRate,
        grossPay: payroll.grossPay,
        taxes: taxes,
        deductions: deductions,
        netPay: netPay,
        timeEntries: employeeTimeEntries.map(entry => entry._id)
      };

      payrollData.push(employeePayroll);
      totalHours += payroll.totalHours;
      totalWages += payroll.grossPay;
    }

    // Create payroll period
    const payrollPeriod = new PayrollPeriod({
      companyId: companyId,
      periodStart: periodStart,
      periodEnd: periodEnd,
      totalHours: totalHours,
      totalWages: totalWages,
      employees: payrollData,
      status: 'draft'
    });

    await payrollPeriod.save();

    res.json({
      success: true,
      message: 'Payroll generated successfully',
      data: {
        payrollPeriod: payrollPeriod,
        summary: {
          totalEmployees: employees.length,
          totalHours: totalHours,
          totalWages: totalWages,
          averageHoursPerEmployee: totalHours / employees.length,
          averageWagePerEmployee: totalWages / employees.length
        }
      }
    });

  } catch (error) {
    console.error('Payroll generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get payroll periods for a company
router.get('/periods/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { companyId: companyId };
    if (status) {
      query.status = status;
    }

    const payrollPeriods = await PayrollPeriod.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('employees.employeeId', 'firstName lastName email');

    const total = await PayrollPeriod.countDocuments(query);

    res.json({
      success: true,
      data: {
        payrollPeriods: payrollPeriods,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Get payroll periods error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get specific payroll period
router.get('/period/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params;

    const payrollPeriod = await PayrollPeriod.findById(periodId)
      .populate('employees.employeeId', 'firstName lastName email phone')
      .populate('companyId', 'name address');

    if (!payrollPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    res.json({
      success: true,
      data: payrollPeriod
    });

  } catch (error) {
    console.error('Get payroll period error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update payroll period status
router.patch('/period/:periodId/status', async (req, res) => {
  try {
    const { periodId } = req.params;
    const { status } = req.body;

    if (!['draft', 'pending', 'approved', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: draft, pending, approved, paid'
      });
    }

    const payrollPeriod = await PayrollPeriod.findByIdAndUpdate(
      periodId,
      { status: status, updatedAt: new Date() },
      { new: true }
    );

    if (!payrollPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    res.json({
      success: true,
      message: 'Payroll period status updated successfully',
      data: payrollPeriod
    });

  } catch (error) {
    console.error('Update payroll status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Set employee payroll settings
router.post('/employee/settings', async (req, res) => {
  try {
    const { error, value } = employeePayrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { employeeId, hourlyRate, overtimeRate, overtimeThreshold } = value;

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Create or update payroll settings
    const payrollSettings = await EmployeePayroll.findOneAndUpdate(
      { employeeId: employeeId },
      {
        employeeId: employeeId,
        companyId: employee.companyId,
        hourlyRate: hourlyRate,
        overtimeRate: overtimeRate,
        overtimeThreshold: overtimeThreshold,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Employee payroll settings updated successfully',
      data: payrollSettings
    });

  } catch (error) {
    console.error('Set employee payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get employee payroll settings
router.get('/employee/:employeeId/settings', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payrollSettings = await EmployeePayroll.findOne({ employeeId: employeeId });

    if (!payrollSettings) {
      return res.status(404).json({
        success: false,
        message: 'Payroll settings not found for this employee'
      });
    }

    res.json({
      success: true,
      data: payrollSettings
    });

  } catch (error) {
    console.error('Get employee payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Generate payroll report
router.post('/report/generate', async (req, res) => {
  try {
    const { companyId, reportType, periodStart, periodEnd } = req.body;

    // Get payroll periods for the date range
    const payrollPeriods = await PayrollPeriod.find({
      companyId: companyId,
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd }
    });

    if (payrollPeriods.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payroll data found for the specified period'
      });
    }

    // Calculate report statistics
    const totalEmployees = new Set();
    let totalHours = 0;
    let totalWages = 0;
    let overtimeHours = 0;
    let overtimePay = 0;

    payrollPeriods.forEach(period => {
      totalHours += period.totalHours;
      totalWages += period.totalWages;

      period.employees.forEach(employee => {
        totalEmployees.add(employee.employeeId.toString());

        // Calculate overtime (simplified)
        if (employee.hoursWorked > 40) {
          overtimeHours += employee.hoursWorked - 40;
          overtimePay += (employee.hoursWorked - 40) * employee.hourlyRate * 0.5;
        }
      });
    });

    const report = new PayrollReport({
      companyId: companyId,
      reportType: reportType,
      periodStart: periodStart,
      periodEnd: periodEnd,
      totalEmployees: totalEmployees.size,
      totalHours: totalHours,
      totalWages: totalWages,
      averageHoursPerEmployee: totalHours / totalEmployees.size,
      averageWagePerEmployee: totalWages / totalEmployees.size,
      overtimeHours: overtimeHours,
      overtimePay: overtimePay,
      generatedBy: req.user?.id || 'system'
    });

    await report.save();

    res.json({
      success: true,
      message: 'Payroll report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('Generate payroll report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get payroll reports
router.get('/reports/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reports = await PayrollReport.find({ companyId: companyId })
      .sort({ generatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PayrollReport.countDocuments({ companyId: companyId });

    res.json({
      success: true,
      data: {
        reports: reports,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Get payroll reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;