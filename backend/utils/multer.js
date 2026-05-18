const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc/';
    
    // Route files to specific directories based on their form field name
    if (file.fieldname === 'document') {
      folder = 'uploads/contracts/';
    } else if (file.fieldname === 'attachment') {
      folder = 'uploads/leave_docs/';
    } else if (file.fieldname === 'cv') {
      folder = 'uploads/cvs/';
    }
    
    const dir = path.join(__dirname, '..', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

module.exports = multer({ storage });