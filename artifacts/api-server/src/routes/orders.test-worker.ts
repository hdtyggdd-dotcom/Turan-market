// Isolated HTTP worker used only by orders.test.ts, not registered in the app.
import express from "express";
import ordersRouter from "./orders.js";
import { users, listings } from "../data/store.js";
import { pool } from "@workspace/db";
const prefix = process.argv[2]!;
users.push(
  { ...users[0]!, id: `${prefix}-buyer` },
  { ...users[0]!, id: `${prefix}-other` },
  { ...users[1]!, id: `${prefix}-seller` },
);
listings.push({ ...listings[0]!, id: `${prefix}-product`, userId: `${prefix}-seller`, price: 1000, status: "active" });
const app = express();
app.use(express.json());
app.use(ordersRouter);
const server = app.listen(0, "127.0.0.1", () => {
  process.stdout.write(JSON.stringify({ port: (server.address() as { port: number }).port }) + "\n");
});
process.on("SIGTERM", () => server.close(() => void pool.end().then(() => process.exit(0))));
