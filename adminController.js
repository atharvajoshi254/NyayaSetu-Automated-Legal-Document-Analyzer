const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Document = require('../models/Document');
const Summary = require('../models/Summary');
const FreeTrialLog = require('../models/FreeTrialLog');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDocuments = await Document.countDocuments();
    const totalSummaries = await Summary.countDocuments();
    
    // Get recent documents
    const recentDocuments = await Document.find()
      .select('fileName fileType fileSize createdAt summary user')
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('summary', 'createdAt');
    
    // Get new users (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: lastWeek },
      role: 'user'
    });
    
    // Get new documents (last 7 days)
    const newDocuments = await Document.countDocuments({
      createdAt: { $gte: lastWeek }
    });
    
    res.status(200).json({
      success: true,
      totalUsers,
      totalDocuments,
      totalSummaries,
      newUsers,
      newDocuments,
      recentDocuments
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics'
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await User.countDocuments();
  
  // Aggregate to get document count for each user
  const usersWithDocumentCount = await User.aggregate([
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'user',
        as: 'documents'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        documentCount: { $size: '$documents' }
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: startIndex },
    { $limit: limit }
  ]);

  res.status(200).json({
    success: true,
    count: usersWithDocumentCount.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users: usersWithDocumentCount
  });
});

// @desc    Get all documents
// @route   GET /api/admin/documents
// @access  Admin
const getAllDocuments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const total = await Document.countDocuments();
  
  const documents = await Document.find()
    .select('fileName fileType fileSize createdAt summary user')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('user', 'name email')
    .populate('summary', 'createdAt');

  res.status(200).json({
    success: true,
    count: documents.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    documents
  });
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deletion of admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    // Find all documents by this user
    const documents = await Document.find({ user: user._id });
    
    // Delete all associated summaries and documents
    for (const doc of documents) {
      if (doc.summary) {
        await Summary.findByIdAndDelete(doc.summary);
      }
      await doc.deleteOne();
    }
    
    // Delete the user
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Get free trial statistics
// @route   GET /api/admin/free-trials
// @access  Admin
const getFreeTrials = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    const total = await FreeTrialLog.countDocuments();
    
    // Get trial logs with pagination
    const trialLogs = await FreeTrialLog.find()
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get stats
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const trialsToday = await FreeTrialLog.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const trialsThisWeek = await FreeTrialLog.countDocuments({
      timestamp: { $gte: lastWeek }
    });
    
    // Get file type distribution
    const fileTypeStats = await FreeTrialLog.aggregate([
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: trialLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      trialsToday,
      trialsThisWeek,
      fileTypeStats,
      trialLogs
    });
  } catch (error) {
    console.error('Error getting free trial stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve free trial statistics'
    });
  }
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllDocuments,
  deleteUser,
  getFreeTrials
};