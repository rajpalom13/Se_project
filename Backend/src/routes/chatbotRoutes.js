const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/message', chatbotController.sendMessage);
router.get('/history', chatbotController.getChatHistory);

module.exports = router;