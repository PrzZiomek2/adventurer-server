import { Router } from "express";
import { placeClicksController } from "../controllers/place";

const router = Router();

router.post("/api/place", placeClicksController);

export default router;
