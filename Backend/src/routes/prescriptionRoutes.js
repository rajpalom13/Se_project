const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prescriptionController = require('../controllers/prescriptionController');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed!'));
  }
});

router.use(protect);

router.get('/my', prescriptionController.getPatientPrescriptions);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.post('/', upload.single('image'), prescriptionController.addPrescription);
router.put('/:id', upload.single('image'), prescriptionController.updatePrescription);

module.exports = router;
