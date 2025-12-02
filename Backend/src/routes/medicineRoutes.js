const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('patient'));

router.get('/', medicineController.getMedicines);
router.post('/', medicineController.createMedicine);
router.patch('/:id', medicineController.updateMedicine);
router.patch('/:id/taken', medicineController.markMedicineTaken);
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;