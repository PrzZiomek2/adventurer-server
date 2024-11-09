import { Router } from "express";
import { placeRouter } from "./places";

export const routes = (app: Router): void => {
  placeRouter(app);
};
