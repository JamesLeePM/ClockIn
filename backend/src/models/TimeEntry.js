const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  type: {
    type: String,
    enum: ['checkin', 'checkout'],
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    accuracy: Number
  },
  method: {
    type: String,
    enum: ['NFC', 'QR', 'Manual', 'GPS'],
    default: 'Manual'
  },
  isSynced: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 500
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
timeEntrySchema.index({ employeeId: 1, checkInTime: -1 });
timeEntrySchema.index({ companyId: 1, checkInTime: -1 });
timeEntrySchema.index({ checkInTime: -1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
