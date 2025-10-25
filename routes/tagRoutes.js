const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// GET /tags/:tagId - Get plant associated with a tag
router.get('/tags/:tagId', dataController.getTaggedPlant);

// GET /tags - Get all tag mappings
router.get('/tags', dataController.getAllTags);

// POST /tags - Add or update a tag mapping
router.post('/tags', dataController.addOrUpdateTag);

// DELETE /tags/:tagId - Delete a tag mapping
router.delete('/tags/:tagId', dataController.deleteTag);

module.exports = router;
