const express = require('express');
const router = express.Router();

// Mock database
const timeEntries = new Map();

// POST /api/time-entries/checkin
router.post('/checkin', (req, res) => {
  const { userId, companyId, location, method } = req.body;
  
  const timeEntry = {
    id: `entry_${Date.now()}`,
    userId,
    companyId,
    type: 'checkin',
    timestamp: new Date(),
    location,
    method: method || 'NFC',
    synced: true
  };

  timeEntries.set(timeEntry.id, timeEntry);

  res.status(201).json({
    success: true,
    message: 'Check-in recorded successfully',
    timeEntry
  });
});

// POST /api/time-entries/checkout
router.post('/checkout', (req, res) => {
  const { userId, companyId, location, method } = req.body;
  
  const timeEntry = {
    id: `entry_${Date.now()}`,
    userId,
    companyId,
    type: 'checkout',
    timestamp: new Date(),
    location,
    method: method || 'NFC',
    synced: true
  };

  timeEntries.set(timeEntry.id, timeEntry);

  res.status(201).json({
    success: true,
    message: 'Check-out recorded successfully',
    timeEntry
  });
});

// GET /api/time-entries/:userId
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  // Filter entries by user and date range
  const userEntries = Array.from(timeEntries.values())
    .filter(entry => entry.userId === userId)
    .filter(entry => {
      if (startDate && endDate) {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    timeEntries: userEntries
  });
});

module.exports = router;
