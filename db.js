const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Add debug information
    console.log('Attempting to connect to MongoDB...');
    console.log(`URI: ${process.env.MONGO_URI?.replace(/\/\/(.+?):.+?@/, '//\\1:****@')}`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.underline.bold);
    console.error('Please check:');
    console.error('1. MongoDB Atlas connection is active');
    console.error('2. Your IP is whitelisted in MongoDB Atlas');
    console.error('3. Username and password are correct');
    console.error('4. Network connectivity to MongoDB servers');
    
    // Don't exit the process, just log the error
    console.error('Server will continue without database connection...'.yellow);
  }
};

module.exports = connectDB;