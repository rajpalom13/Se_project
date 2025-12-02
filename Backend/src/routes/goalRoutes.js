const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(goalController.getGoals)
  .post(goalController.addGoal);

router.route('/:id')
  .put(goalController.updateProgress)
  .delete(goalController.deleteGoal);

module.exports = router;
