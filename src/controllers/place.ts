import { Request, Response } from "express";
import { DbService } from "../services/postgreSQL/postgreDb";
import { pgConfig } from "../services/postgreSQL/pgConfig";

export const getPlaceMostClicksController = async (
  req: Request,
  res: Response
) => {
  try {
    const dbService = new DbService(pgConfig);
    const dbRes = await dbService.getTableRows(`
      SELECT 
        name, 
        id, 
        (SUM(count_click_map) + SUM(count_click_details)) AS click_total
      FROM clicks
      GROUP BY name, id
      ORDER BY click_total DESC
      LIMIT 1;
    `);

    if (!dbRes) throw new Error(`error from db: ${dbRes}`);

    res.status(200).json({
      place: dbRes.rows[0],
    });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "Internal Server Error" });
  }
};
