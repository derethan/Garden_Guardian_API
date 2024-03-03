const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

//Define user related routes
router.post('/register', userController.register);
router.post('/login', userController.login);

router.post('/addDevice', userController.addDevice);
router.get ('/checkForDevice', userController.checkForDevice);

router.get('/protected',userController.verifyToken, userController.protectedRoute);

module.exports = router;

