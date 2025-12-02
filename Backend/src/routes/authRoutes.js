const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.get('/doctors', protect, authController.getAllDoctors);
router.get('/my-doctors', protect, authController.getMyDoctors);
router.get('/patients', protect, authController.getPatients);

module.exports = router;

// backend/src/middleware/authMiddleware.js
