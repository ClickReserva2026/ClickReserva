import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roomsRouter from "./rooms";
import reservationsRouter from "./reservations";
import professorsRouter from "./professors";
import dashboardRouter from "./dashboard";
import absencesRouter from "./absences";
import configRouter from "./config";
import blockedSlotsRouter from "./blocked-slots";
import feedbackRouter from "./feedback";
import reportsRouter from "./reports";
import notificationsRouter from "./notifications"; // ← LINHA NOVA

const router: IRouter = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(roomsRouter);
router.use(reservationsRouter);
router.use(professorsRouter);
router.use(dashboardRouter);
router.use(absencesRouter);
router.use(configRouter);
router.use(blockedSlotsRouter);
router.use(feedbackRouter);
router.use(reportsRouter);
router.use(notificationsRouter); // ← LINHA NOVA

export default router;
