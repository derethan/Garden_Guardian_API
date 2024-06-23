const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

//Define user account routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/changePassword", userController.changePassword);

// User device routes
router.post("/addDevice", userController.addDevice);
router.get("/checkForDevice", userController.checkForDevice);

//User Garden routes

//CREATE
router.post(
  "/:userID/gardens",
  userController.verifyToken,
  userController.addGarden
);

//READ
router.get(
  "/:userID/gardens",
  userController.verifyToken,
  userController.getGardens
);

//DELETE
router.delete(
  "/:userID/gardens/:gardenID",
  userController.verifyToken,
  userController.deleteGarden
);

// Group routes
router.get(
  "/:userID/gardens/groups",
  userController.verifyToken,
  userController.getGardenGroups
);

// Used for Authentication, Token Verification for protected Pages
router.get(
  "/protected",
  userController.verifyToken,
  userController.protectedRoute
);

module.exports = router;
