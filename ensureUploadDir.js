const fs = require('fs');
const path = require('path');

/**
 * Ensures that the uploads directories exist
 */
const ensureUploadDirectories = () => {
  const baseUploadDir = path.join(__dirname, '../uploads');
  const tempUploadDir = path.join(baseUploadDir, '/temp');
  
  // Create base upload directory if it doesn't exist
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
    console.log('Created uploads directory');
  }
  
  // Create temporary uploads directory if it doesn't exist
  if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
    console.log('Created temporary uploads directory');
  }
};

module.exports = ensureUploadDirectories;