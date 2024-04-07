const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

//Define data Route for Fruityvice API
router.get('/fruit/all', dataController.getAllFruit);
router.get('/fruit/:name', dataController.getFruitByName);
router.get('/plants/all', dataController.getAllPlants);
router.get ('/plants/edible', dataController.getEdiblePlants);
router.get ('/plants/:name', dataController.getPlantsByName)

module.exports = router;