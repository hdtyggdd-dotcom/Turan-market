import app from "./app";
import { logger } from "./lib/logger";
import { initializePersistence } from "./lib/persistence.js";
import { imageStore } from "./routes/uploads.js";
import { initializeImagePersistence } from "./lib/persistence.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function bootstrap() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  await initializePersistence();
  await initializeImagePersistence(imageStore);
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening with durable PostgreSQL state");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Unable to initialize database persistence");
  process.exit(1);
});
