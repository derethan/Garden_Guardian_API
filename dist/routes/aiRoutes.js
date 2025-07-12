"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const router = (0, express_1.Router)();
router.get("/plants/:plant", aiController_1.generatePlantDescription);
router.post("/generatePlantInfo", aiController_1.generatePlantInfo);
exports.default = router;
