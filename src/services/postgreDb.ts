import { Pool, PoolConfig } from "pg";
import "dotenv/config";

interface Place {
  name: string;
  id: string;
  click_location: string;
}

export class DbService {
  private pool: Pool;
  createClicksTableQuery = `
    CREATE TABLE IF NOT EXISTS clicks (
      name VARCHAR(200) PRIMARY KEY,
      id VARCHAR(100),
      count_click_map INTEGER DEFAULT 0,
      count_click_details INTEGER DEFAULT 0
    );
  `;
  insertClicksDataQuery = `
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
      id = EXCLUDED.id;
  `;

  constructor(pgData: PoolConfig) {
    this.pool = new Pool(pgData);
  }

  async init() {
    const client = await this.pool.connect();

    try {
      await client.query(this.createClicksTableQuery);
    } catch (error) {
      console.error("Error while saving batch to database:", error);
    } finally {
      client.release();
    }
  }

  async insertClicksData(clickBatch: Place[]) {
    if (!clickBatch.length) return;

    let client = null;

    try {
      client = await this.pool.connect();
      await client.query(this.createClicksTableQuery);

      for (const data of clickBatch) {
        const { name, id, click_location } = data;
        await client.query(this.insertClicksDataQuery, [
          name,
          id,
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
