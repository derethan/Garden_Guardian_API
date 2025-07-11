import { Router } from "express";
import { addPlant, getAllPlants, getPlantDetails, getPlantVarieties, getVarietyDetails, getTaggedPlant } from "../controllers/dataController";

const router = Router();

router.get("/status", (req, res) => {
  res.status(200).json({ status: "online" });
});

router.post("/plants", addPlant);

router.get("/plants", getAllPlants);

router.get("/plants/:plant", getPlantDetails);

router.get("/plants/:plant/varieties", getPlantVarieties);

router.get("/plants/:plant/varieties/:variety", getVarietyDetails);

router.get("/tags/:tagId", getTaggedPlant);

export default router;