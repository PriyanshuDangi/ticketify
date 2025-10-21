const multer = require('multer');

// Configure multer for image uploads with 8MB limit
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only images
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 8388608, // 8MB in bytes
  },
  fileFilter: fileFilter
});

module.exports = upload;

