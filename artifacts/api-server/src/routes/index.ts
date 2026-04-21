import { Router, type IRouter } from "express";
import healthRouter from "./health";
import homeRouter from "./home";
import usersRouter from "./users";
import itemsRouter from "./items";

const router: IRouter = Router();

router.use(homeRouter);
router.use(healthRouter);
router.use(usersRouter);
router.use(itemsRouter);

export default router;
