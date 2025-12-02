const Message = require('../models/Message');

// @desc    Get conversation with a specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      content
    });

    // Socket.io emission handled in controller or server?
    // Usually better to emit from here if we have access to io
    const io = req.app.get('io');
    if (io) {
      // Emit to both sender and receiver (or just receiver)
      // Ideally we use rooms: io.to(receiverId).emit(...)
      // But we don't have user-specific rooms set up yet.
      // We can broadcast 'message:receive' and client filters it.
      io.emit('message:receive', message);
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};
