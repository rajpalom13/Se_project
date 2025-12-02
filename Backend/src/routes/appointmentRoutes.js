const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.createAppointment);
router.patch('/:id', appointmentController.updateAppointment);

module.exports = router;