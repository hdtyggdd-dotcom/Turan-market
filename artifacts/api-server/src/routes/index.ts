import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import locationsRouter from "./locations.js";
import categoriesRouter from "./categories.js";
import listingsRouter from "./listings.js";
import deliveryRouter from "./delivery.js";
import ordersRouter from "./orders.js";
import statsRouter from "./stats.js";
import sellersRouter from "./sellers.js";
import uploadsRouter from "./uploads.js";
import aiRouter from "./ai.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(locationsRouter);
router.use(categoriesRouter);
router.use(listingsRouter);
router.use(deliveryRouter);
router.use(ordersRouter);
router.use(statsRouter);
router.use(sellersRouter);
router.use(uploadsRouter);
router.use(aiRouter);

export default router;
