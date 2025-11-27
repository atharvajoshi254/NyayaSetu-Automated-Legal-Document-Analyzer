const express = require('express');
const { 
  getDashboardStats, 
  getAllUsers, 
  getAllDocuments, 
  deleteUser,
  getFreeTrials
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Apply protection middlewares to all routes
router.use(protect);
router.use(admin);

// Admin routes
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/documents', getAllDocuments);
router.get('/free-trials', getFreeTrials);
router.delete('/users/:id', deleteUser);

module.exports = router;