const express = require('express');
const router = express.Router();
const medicineLogController = require('../controllers/medicineLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', medicineLogController.logMedicine);
router.get('/patient/:patientId', medicineLogController.getPatientLogs);
router.put('/:id/comment', medicineLogController.addComment);

module.exports = router;
