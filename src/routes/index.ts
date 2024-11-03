import { Router } from "express";
import { getPlaceMostClicksController } from "../controllers/place";

const router = Router();

router.get("/api/place-most-clicks", getPlaceMostClicksController);

export default router;
