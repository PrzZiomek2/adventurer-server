import { Router } from "express";
import { getMostClicksPlaceController } from "../controllers/places/place";
import { getMostClicksPlacesController } from "../controllers/places/places";
import { connectRoutesWithApp } from "./helpers";

const placeRoutes = {
  /*** GET places with most cicks in every place category (nearby, country, world) */
  "/api/places-most-clicked": getMostClicksPlacesController,

  /*** GET single place with most cicks from all */
  "/api/place-most-clicked": getMostClicksPlaceController,
};

export const placeRouter = (app: Router): void => {
  connectRoutesWithApp(app, placeRoutes);
};
