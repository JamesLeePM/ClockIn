const express = require('express');
const Joi = require('joi');
const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { TimeEntry } = require('../models/TimeEntry');
const { PayrollPeriod, PayrollReport } = require('../models/Payroll');

const router = express.Router();

// Validation schemas
const companyUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  address: Joi.string().min(5).max(200),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  email: Joi.string().email(),
  settings: Joi.object({
    allowNFC: Joi.boolean(),
    allowQR: Joi.boolean(),
    allowManual: Joi.boolean(),
    requireLocation: Joi.boolean(),
    locationRadius: Joi.number().positive(),
    overtimeThreshold: Joi.number().positive().default(40),
    timezone: Joi.string().default('UTC')
  })
});

const employeeUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  role: Joi.string().valid('employee', 'manager', 'admin'),
  isActive: Joi.boolean(),
  hourlyRate: Joi.number().positive(),
  department: Joi.string().max(100),
  position: Joi.string().max(100)
});

// Get company dashboard data
router.get('/dashboard/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = 'week' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Get company info
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get employee statistics
    const totalEmployees = await User.countDocuments({ 
      companyId: companyId, 
      role: 'employee' 
    });
    const activeEmployees = await User.countDocuments({ 
      companyId: companyId, 
      role: 'employee', 
      isActive: true 
    });

    // Get time entry statistics
    const timeEntries = await TimeEntry.find({
      companyId: companyId,
      checkInTime: { $gte: startDate, $lte: endDate }
    });

    const totalHours = timeEntries.reduce((sum, entry) => {
      if (entry.checkOutTime) {
        const hours = (new Date(entry.checkOutTime) - new Date(entry.checkInTime)) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const averageHoursPerEmployee = activeEmployees > 0 ? totalHours / activeEmployees : 0;

    // Get recent time entries
    const recentEntries = await TimeEntry.find({
      companyId: companyId,
      checkInTime: { $gte: startDate, $lte: endDate }
    })
    .populate('employeeId', 'firstName lastName')
    .sort({ checkInTime: -1 })
    .limit(10);

    // Get payroll statistics
    const payrollPeriods = await PayrollPeriod.find({
      companyId: companyId,
      periodStart: { $gte: startDate, $lte: endDate }
    });

    const totalWages = payrollPeriods.reduce((sum, period) => sum + period.totalWages, 0);

    // Get employee performance data
    const employeePerformance = await User.aggregate([
      {
        $match: {
          companyId: companyId,
          role: 'employee',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'timeentries',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'timeEntries'
        }
      },
      {
        $addFields: {
          totalHours: {
            $sum: {
              $map: {
                input: '$timeEntries',
                as: 'entry',
                in: {
                  $cond: {
                    if: { $ne: ['$$entry.checkOutTime', null] },
                    then: {
                      $divide: [
                        { $subtract: ['$$entry.checkOutTime', '$$entry.checkInTime'] },
                        3600000
                      ]
                    },
                    else: 0
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          totalHours: 1,
          timeEntriesCount: { $size: '$timeEntries' }
        }
      },
      {
        $sort: { totalHours: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get attendance patterns
    const attendancePatterns = await TimeEntry.aggregate([
      {
        $match: {
          companyId: companyId,
          checkInTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$checkInTime'
            }
          },
          totalEntries: { $sum: 1 },
          uniqueEmployees: { $addToSet: '$employeeId' }
        }
      },
      {
        $addFields: {
          uniqueEmployeeCount: { $size: '$uniqueEmployees' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          address: company.address,
          phone: company.phone,
          email: company.email,
          settings: company.settings
        },
        statistics: {
          totalEmployees: totalEmployees,
          activeEmployees: activeEmployees,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100,
          totalWages: totalWages,
          period: period,
          dateRange: {
            start: startDate,
            end: endDate
          }
        },
        recentActivity: recentEntries,
        employeePerformance: employeePerformance,
        attendancePatterns: attendancePatterns
      }
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all employees for a company
router.get('/employees/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    const query = { companyId: companyId };
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(query)
      .select('-password -otpCode -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        employees: employees,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update employee
router.patch('/employees/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { error, value } = employeeUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const employee = await User.findByIdAndUpdate(
      employeeId,
      { ...value, updatedAt: new Date() },
      { new: true }
    ).select('-password -otpCode -otpExpiry');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update company settings
router.patch('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { error, value } = companyUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const company = await Company.findByIdAndUpdate(
      companyId,
      { ...value, updatedAt: new Date() },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get company analytics
router.get('/analytics/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Get time entry analytics
    const timeAnalytics = await TimeEntry.aggregate([
      {
        $match: {
          companyId: companyId,
          checkInTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$checkInTime'
            }
          },
          totalEntries: { $sum: 1 },
          totalHours: {
            $sum: {
              $cond: {
                if: { $ne: ['$checkOutTime', null] },
                then: {
                  $divide: [
                    { $subtract: ['$checkOutTime', '$checkInTime'] },
                    3600000
                  ]
                },
                else: 0
              }
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get employee performance analytics
    const employeeAnalytics = await User.aggregate([
      {
        $match: {
          companyId: companyId,
          role: 'employee',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'timeentries',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'timeEntries'
        }
      },
      {
        $addFields: {
          totalHours: {
            $sum: {
              $map: {
                input: '$timeEntries',
                as: 'entry',
                in: {
                  $cond: {
                    if: { $ne: ['$$entry.checkOutTime', null] },
                    then: {
                      $divide: [
                        { $subtract: ['$$entry.checkOutTime', '$$entry.checkInTime'] },
                        3600000
                      ]
                    },
                    else: 0
                  }
                }
              }
            }
          },
          totalEntries: { $size: '$timeEntries' }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          totalHours: 1,
          totalEntries: 1,
          averageHoursPerEntry: {
            $cond: {
              if: { $gt: ['$totalEntries', 0] },
              then: { $divide: ['$totalHours', '$totalEntries'] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { totalHours: -1 }
      }
    ]);

    // Get payroll analytics
    const payrollAnalytics = await PayrollPeriod.aggregate([
      {
        $match: {
          companyId: companyId,
          periodStart: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPeriods: { $sum: 1 },
          totalWages: { $sum: '$totalWages' },
          totalHours: { $sum: '$totalHours' },
          averageWagesPerPeriod: { $avg: '$totalWages' },
          averageHoursPerPeriod: { $avg: '$totalHours' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: period,
        dateRange: {
          start: startDate,
          end: endDate
        },
        timeAnalytics: timeAnalytics,
        employeeAnalytics: employeeAnalytics,
        payrollAnalytics: payrollAnalytics[0] || {
          totalPeriods: 0,
          totalWages: 0,
          totalHours: 0,
          averageWagesPerPeriod: 0,
          averageHoursPerPeriod: 0
        }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Export company data
router.get('/export/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type = 'employees', format = 'json' } = req.query;

    let data;
    
    switch (type) {
      case 'employees':
        data = await User.find({ companyId: companyId })
          .select('-password -otpCode -otpExpiry')
          .sort({ createdAt: -1 });
        break;
        
      case 'timeEntries':
        data = await TimeEntry.find({ companyId: companyId })
          .populate('employeeId', 'firstName lastName email')
          .sort({ checkInTime: -1 });
        break;
        
      case 'payroll':
        data = await PayrollPeriod.find({ companyId: companyId })
          .populate('employees.employeeId', 'firstName lastName email')
          .sort({ createdAt: -1 });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type. Must be one of: employees, timeEntries, payroll'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_${companyId}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: data,
        exportedAt: new Date(),
        type: type,
        format: format
      });
    }

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    const obj = row.toObject ? row.toObject() : row;
    return headers.map(header => {
      const value = obj[header];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
