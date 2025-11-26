import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import departmentsRoutes from "./routes/departments";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/departments", departmentsRoutes);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
