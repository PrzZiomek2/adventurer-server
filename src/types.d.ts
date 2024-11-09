interface Place {
  name: string;
  id: string;
  click_location: string;
  place_type: "nearby" | "country" | "world";
}

type RequestMethods = "get" | "post" | "put" | "delete" | "patch";

type RouteList = Record<
  string,
  (req: Request, res: Response) => Promise<Response | void> | void
>;
