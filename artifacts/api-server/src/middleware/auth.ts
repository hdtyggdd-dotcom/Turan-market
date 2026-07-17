import { type Request, type Response, type NextFunction } from "express";
import { users, verifyToken } from "../data/store.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "User not found" });
    return;
  }

  req.userId = userId;
  next();
}
