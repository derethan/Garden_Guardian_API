const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

//HealthCheck Route
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

//Define data Route to Add a new plant to the database
router.post('/plants', dataController.addPlant);

//Define data Route to Get All plants from the datatbase
router.get('/plants', dataController.getAllPlants);

//Define data Route to Get Details of a Specified plant
// router.get('/plants/:plant', dataController.getPlantDetails);

// Define data Route to Get All Varieties for an a selected plant
router.get('/plants/:plant/varieties', dataController.getPlantVariety);

//Define data Route to Get Details of a specified plant variety
// router.get('/plants/:plant/varieties/:variety', dataController.getVarietyDetails);








module.exports = router;