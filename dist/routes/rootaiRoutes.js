"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rootaiController_1 = require("../controllers/rootaiController");
const router = (0, express_1.Router)();
router.post("/:userid/chat", rootaiController_1.chatWithRootAI);
exports.default = router;
