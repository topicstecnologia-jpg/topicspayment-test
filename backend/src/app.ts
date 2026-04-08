import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiRouter } from "./routes";
import { applySecurityHeaders, protectCookieSessionMutations } from "./security";

const app = express();
const allowedOrigins = new Set([env.FRONTEND_URL]);

if (env.NODE_ENV !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
  allowedOrigins.add("http://[::1]:3000");
}

app.disable("x-powered-by");
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

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
app.use(applySecurityHeaders);
app.use(express.json({ limit: "16mb" }));
app.use(cookieParser());
app.use(protectCookieSessionMutations);

function healthHandler(_request: express.Request, response: express.Response) {
  response.json({
    status: "ok",
    service: "TOPICS Pay API"
  });
}

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/", apiRouter);
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { app };
