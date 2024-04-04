import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { client, db } from './db';

const main = async () => {
  try {
    await client.connect();
    await migrate(db, { migrationsFolder: 'src/drizzle/migrations' });
    await client.end();

    console.log('migration done successfully, closing connection...');
  } catch (e) {
    console.error(e);
  }
};

await main();
