/***************************************
 *  Root AI Routes
 *
 *  This file contains the routes for the rootaiController
 * ************************************/

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/rootaiController");


//Route for user to Chat with the AI
router.post("/:userid/chat", aiController.chatWithRootAI);

module.exports = router;