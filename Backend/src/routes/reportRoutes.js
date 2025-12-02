const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for reports
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs and Docs are allowed!'));
  }
});

router.use(protect);

router.get('/my', reportController.getPatientReports);
router.get('/patient/:patientId', reportController.getPatientReports);
router.post('/', upload.single('file'), reportController.addReport);
router.put('/:id', upload.single('file'), reportController.updateReport);

module.exports = router;
