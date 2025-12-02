const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:userId', messageController.getConversation);
router.post('/', messageController.sendMessage);

module.exports = router;
