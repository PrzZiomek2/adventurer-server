import { Request, Response } from "express";
import { client } from "..";

interface Place {
  name: string;
  id: string;
  click_location: string;
}

export const placeClicksController = async (req: Request, res: Response) => {
  const { name, id, click_location } = req.body.place as Place;

  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS clicks (
            name VARCHAR(200) PRIMARY KEY,
            id VARCHAR(100),
            count_click_map INTEGER DEFAULT 0,
            count_click_details INTEGER DEFAULT 0
        )
    `;
  const insertDataQuery = `
        INSERT INTO clicks (name, id, count_click_map, count_click_details) 
        VALUES (
            $1, 
            $2, 
            CASE WHEN $3 = 'map' THEN 1 ELSE 0 END, 
            CASE WHEN $3 = 'details' THEN 1 ELSE 0 END
        )
        ON CONFLICT (name)
        DO UPDATE SET
          count_click_map = clicks.count_click_map + 
              (CASE WHEN EXCLUDED.count_click_map = 1 THEN 1 ELSE 0 END),
          count_click_details = clicks.count_click_details + 
              (CASE WHEN EXCLUDED.count_click_details = 1 THEN 1 ELSE 0 END),
          id = EXCLUDED.id
    `;

  try {
    if (!name || !id || !click_location) {
      throw new Error("All fields are required");
    }

    await client.query(createTableQuery);
    await client.query(insertDataQuery, [name, id, click_location]);

    res.status(200).json({
      message: "Data inserted successfully",
    });
  } catch (error) {
    console.log({ error });

    res.status(500).json({ message: "Internal Server Error" });
  }
};
