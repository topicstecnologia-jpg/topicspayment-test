import { Router } from "express";

import { validateBody } from "../../middleware/validate.middleware";
import { createPlatformCheckoutPayment } from "./payment.controller";
import { createCheckoutPaymentSchema } from "./payment.schema";

export const paymentRouter = Router();

paymentRouter.post("/checkout", validateBody(createCheckoutPaymentSchema), createPlatformCheckoutPayment);
