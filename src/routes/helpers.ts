import { Router } from "express";

export const connectRoutesWithApp = (
  router: Router,
  routes: any,
  method: RequestMethods = "get"
): void => {
  Object.keys(routes).forEach((route) => router[method](route, routes[route]));
};
