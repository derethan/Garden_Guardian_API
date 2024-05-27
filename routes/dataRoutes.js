const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

//HealthCheck Route
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

//Define data Route to get plant from the datatbase
router.get('/plants/all', dataController.getAllPlants);

// Define routes to Add, Update, etc plants in the database
router.post('/plants/add', dataController.addPlant);




module.exports = router;