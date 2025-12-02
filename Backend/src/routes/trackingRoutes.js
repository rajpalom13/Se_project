const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/update', trackingController.updateLocation);
router.get('/doctors', trackingController.getNearbyDoctors);
router.get('/doctor/:id', trackingController.getDoctorLocation);

module.exports = router;