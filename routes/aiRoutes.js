/***************************************
 *  AI Routes
 * 
 *  This file contains the routes for the AI Controller
 * ************************************/


const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route to get the description of a plant
router.get('/:plantName', aiController.getPlantDescription);


module.exports = router;