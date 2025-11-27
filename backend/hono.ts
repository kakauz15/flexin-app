import { Hono } from "hono";
import { cors } from "hono/cors";

import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import departmentsRoutes from "./routes/departments";
import bookingsRoutes from "./routes/bookings";
import swapRequestsRoutes from "./routes/swap-requests";
import settingsRoutes from "./routes/settings";

const app = new Hono();

app.use("*", cors());

// ROTAS REST (compatíveis com seu front)
app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/departments", departmentsRoutes);
app.route("/api/bookings", bookingsRoutes);
app.route("/api/swap-requests", swapRequestsRoutes);
app.route("/api/settings", settingsRoutes);

// rota para teste
app.get("/", (c) => c.json({ status: "ok", message: "API running" }));

export default app;
