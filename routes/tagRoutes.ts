const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.get('/tags/:tagId', dataController.getTaggedPlant);

module.exports = router;
