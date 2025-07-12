"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataController_1 = require("../controllers/dataController");
const router = (0, express_1.Router)();
router.get("/status", (req, res) => {
    res.status(200).json({ status: "online" });
});
router.post("/plants", dataController_1.addPlant);
router.get("/plants", dataController_1.getAllPlants);
router.get("/plants/:plant", dataController_1.getPlantDetails);
router.get("/plants/:plant/varieties", dataController_1.getPlantVarieties);
router.get("/plants/:plant/varieties/:variety", dataController_1.getVarietyDetails);
router.get("/tags/:tagId", dataController_1.getTaggedPlant);
exports.default = router;
