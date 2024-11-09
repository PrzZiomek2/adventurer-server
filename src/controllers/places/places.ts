import { Request, Response } from "express";
import { DbService } from "../../services/postgreSQL/postgreDb";
import { pgConfig } from "../../services/postgreSQL/pgConfig";

export const getMostClicksPlacesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const dbService = new DbService(pgConfig);
    const dbRes = await dbService.getTableRows(`
     WITH clicksByPlaceType AS ( 
        SELECT 
            name, 
            id, 
            place_type,
            ROW_NUMBER() OVER (
                PARTITION BY place_type 
                ORDER BY (SUM(count_click_map) + SUM(count_click_details)) 
                DESC
            ) AS row_n
        FROM clicks
        GROUP BY name, id, place_type
    )
    SELECT 
        name, 
        id, 
        place_type
    FROM clicksByPlaceType
    WHERE row_n = 1
  `);

    if (!dbRes) throw new Error(`error from db: ${dbRes}`);

    res.status(200).json({
      place: dbRes.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
