const Goal = require('../models/Goal');

// @desc    Get daily goals
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
  try {
    // Get goals for today (created today) or all active goals?
    // Let's just get all goals for now, user can filter or we reset them.
    // For MVP, let's assume user manages them.
    const goals = await Goal.find({ user: req.user.id });
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add goal
// @route   POST /api/goals
// @access  Private
exports.addGoal = async (req, res) => {
  try {
    const { title, target, unit } = req.body;
    const goal = await Goal.create({
      user: req.user.id,
      title,
      target,
      unit
    });
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update progress
// @route   PUT /api/goals/:id
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    
    goal.progress = progress;
    await goal.save();
    
    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
