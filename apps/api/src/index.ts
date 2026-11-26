import { createApp } from "./app";
import { database } from "./database";
import { seedDatabaseIfEmpty } from "./seed";

const port = Number(process.env.PORT ?? 3001);
const seededUserCount = await seedDatabaseIfEmpty(database);

if (seededUserCount > 0) {
  console.log(`Seeded ${seededUserCount} demo users.`);
}

createApp(database).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
