import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiRouter } from "./routes";

const app = express();
const allowedOrigins = new Set([env.FRONTEND_URL]);

if (env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
  allowedOrigins.add("http://[::1]:3000");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "16mb" }));
app.use(cookieParser());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "TOPICS Pay API"
  });
});

app.use("/", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { app };
