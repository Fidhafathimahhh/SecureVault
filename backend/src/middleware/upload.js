const multer = require('multer');
const path = require('path');

// Configure multer memory storage so file is encrypted in memory before disk write
const storage = multer.memoryStorage();

const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.vbs', '.ps1', '.msi', '.dll', '.com', '.scr', '.pif', '.hta', '.cpl', '.jar', '.php', '.asp', '.aspx', '.jsp'
];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Security Restriction: Files with extension '${ext}' are not permitted in SecureVault for safety.`), false);
  }
  cb(null, true);
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;
