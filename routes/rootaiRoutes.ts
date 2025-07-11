import { Router } from "express";
import { chatWithRootAI } from "../controllers/rootaiController";

const router = Router();

router.post("/:userid/chat", chatWithRootAI);

export default router;
