import { Router } from "express";
import { categories } from "../data/store.js";
import { registerSportsFitnessCategory } from "../data/sports-fitness-category.js";

const router = Router();

// Keep the sports catalog available through the same endpoint as other categories.
registerSportsFitnessCategory();

// GET /categories
router.get("/categories", (_req, res) => {
  res.json(categories);
});

export default router;
