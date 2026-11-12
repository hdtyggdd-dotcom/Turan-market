import { Router, type Response, type NextFunction } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { users } from "../data/store.js";
import { adviceBudget } from "../lib/advice-budget.js";

const router = Router();
function administrator(req: AuthRequest, res: Response, next: NextFunction) {
  if (users.find(user => user.id === req.userId)?.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "AI budjetini faqat administrator ko‘ra oladi." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  next();
}

router.get("/admin/ai-budget", authenticateToken, administrator, async (req, res) => {
  try {
    res.json(await adviceBudget.read());
  } catch (error) {
    req.log.warn({ err: error }, "AI budget status unavailable");
    res.status(503).json({ error: "ai_budget_unavailable", message: "Budjet ma’lumotini olib bo‘lmadi. Qayta urinib ko‘ring." });
  }
});

router.post("/admin/ai-budget/alerts/:id/read", authenticateToken, administrator, async (req, res) => {
  try {
    const alert = await adviceBudget.acknowledge(String(req.params.id));
    if (!alert) {
      res.status(404).json({ error: "not_found", message: "Ogohlantirish topilmadi." });
      return;
    }
    res.json(alert);
  } catch (error) {
    req.log.warn({ err: error }, "AI budget warning acknowledgement unavailable");
    res.status(503).json({ error: "ai_budget_unavailable", message: "Ogohlantirishni saqlab bo‘lmadi. Qayta urinib ko‘ring." });
  }
});

export default router;
