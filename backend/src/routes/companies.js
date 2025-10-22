const express = require('express');
const router = express.Router();

// GET /api/companies/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock company data
  const company = {
    id,
    name: 'ABC Construction Co.',
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

  res.json({
    success: true,
    company
  });
});

module.exports = router;
