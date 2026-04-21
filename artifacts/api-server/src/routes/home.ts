import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/", (req, res) => {
  req.log.info("Home route hit");
  res.json({
    message: "Welcome to the Express Web Application",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/healthz",
      users: {
        list: "GET /api/users",
        get: "GET /api/users/:id",
        create: "POST /api/users",
        update: "PUT /api/users/:id",
        delete: "DELETE /api/users/:id",
      },
      items: {
        list: "GET /api/items",
        get: "GET /api/items/:id",
        create: "POST /api/items",
        update: "PUT /api/items/:id",
        delete: "DELETE /api/items/:id",
      },
    },
  });
});

export default router;
