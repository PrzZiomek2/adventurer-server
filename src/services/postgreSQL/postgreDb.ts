import { Pool, PoolConfig } from "pg";
import "dotenv/config";

export class DbService {
  private pool: Pool;
  createClicksTableQuery = `
    CREATE TABLE IF NOT EXISTS clicks (
      name VARCHAR(200) PRIMARY KEY,
      id VARCHAR(100),
      place_type VARCHAR(20),
      count_click_map INTEGER DEFAULT 0,
      count_click_details INTEGER DEFAULT 0
    );
  `;
  insertClicksDataQuery = `
    INSERT INTO clicks (name, id, place_type, count_click_map, count_click_details) 
    VALUES (
      $1, 
      $2, 
      $3,
      CASE WHEN $4 = 'map' THEN 1 ELSE 0 END, 
      CASE WHEN $4 = 'details' THEN 1 ELSE 0 END
    )
    ON CONFLICT (name)
    DO UPDATE SET
      count_click_map = clicks.count_click_map + 
          (CASE WHEN EXCLUDED.count_click_map = 1 THEN 1 ELSE 0 END),
      count_click_details = clicks.count_click_details + 
          (CASE WHEN EXCLUDED.count_click_details = 1 THEN 1 ELSE 0 END),
      id = EXCLUDED.id;
  `;

  constructor(pgConfig: PoolConfig) {
    this.pool = new Pool(pgConfig);
  }

  async init() {
    let client = null;

    try {
      client = await this.pool.connect();
      await client.query(this.createClicksTableQuery);
    } catch (error) {
      console.error("Error while saving batch to database:", error);
    } finally {
      client?.release();
    }
  }

  async getTableRows(query: string) {
    let client = null;

    try {
      client = await this.pool.connect();
      const res = await client.query(query);
      return res;
    } catch (error) {
      console.error("Error while getting data from db:", error);
    } finally {
      client?.release();
    }
  }

  async insertClicksData(clickBatch: Place[]) {
    if (!clickBatch.length) return;

    let client = null;

    try {
      client = await this.pool.connect();
      await client.query(this.createClicksTableQuery);

      for (const data of clickBatch) {
        const { name, id, place_type, click_location } = data;
        await client.query(this.insertClicksDataQuery, [
          name,
          id,
          place_type,
          click_location,
        ]);
      }
      clickBatch = [];
    } catch (error) {
      console.error("Error while saving batch to database:", error);
    } finally {
      client?.release();
    }
  }
}

/*
WITH clicksByPlaceType AS ( 
	SELECT 
		name, 
		id, 
		place_type,
		ROW_NUMBER() OVER (
      PARTITION BY place_type ORDER BY (SUM(count_click_map) + SUM(count_click_details)) DESC
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

*/
