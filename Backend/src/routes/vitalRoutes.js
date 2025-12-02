const express = require('express');
const router = express.Router();
const vitalController = require('../controllers/vitalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes are protected

router.route('/')
  .get(vitalController.getVitals)
  .post(vitalController.addVital);

router.get('/patient/:id', vitalController.getPatientVitals);

router.route('/:id')
  .delete(vitalController.deleteVital);

module.exports = router;
