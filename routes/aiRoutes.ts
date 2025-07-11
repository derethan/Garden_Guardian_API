import { Router } from "express";
import { generatePlantDescription, generatePlantInfo } from "../controllers/aiController";

const router = Router();

router.get("/plants/:plant", generatePlantDescription);

router.post("/generatePlantInfo", generatePlantInfo);

export default router;