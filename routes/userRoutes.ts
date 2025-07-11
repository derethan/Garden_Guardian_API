import { Router } from "express";
import {
  register,
  login,
  changePassword,
  addDevice,
  checkForDevice,
  addGarden,
  getGardens,
  deleteGarden,
  addGardenGroup,
  getGardenGroups,
  deleteGardenGroup,
  addGardenPlant,
  getGardenPlants,
  deleteGardenPlant,
  updateGardenPlant,
  protectedRoute,
  verifyToken,
} from "../controllers/userController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/changePassword", changePassword);

router.post("/addDevice", addDevice);
router.get("/checkForDevice", checkForDevice);

router.post(
  "/:userID/gardens",
  verifyToken,
  addGarden
);

router.get(
  "/:userID/gardens",
  verifyToken,
  getGardens
);

router.delete(
  "/:userID/gardens/:gardenID",
  verifyToken,
  deleteGarden
);

router.post(
  "/:userID/gardens/groups",
  verifyToken,
  addGardenGroup
);
router.get(
  "/:userID/gardens/groups",
  verifyToken,
  getGardenGroups
);

router.delete(
  "/:userID/gardens/groups/:groupID",
  verifyToken,
  deleteGardenGroup
);

router.post(
  "/:userID/gardens/plants",
  verifyToken,
  addGardenPlant
);

router.get(
  "/:userID/gardens/plants",
  verifyToken,
  getGardenPlants
);

router.delete(
  "/:userID/gardens/plants/:gardenPlantID",
  verifyToken,
  deleteGardenPlant
);

router.put(
  "/:userID/gardens/plants/:gardenPlantID",
  verifyToken,
  updateGardenPlant
);

router.get(
  "/protected",
  verifyToken,
  protectedRoute
);

export default router;