import type { CreateCheckoutPaymentInput } from "./payment.schema";
import { asyncHandler } from "../../utils/async-handler";
import { createCheckoutPayment } from "./payment.service";

export const createPlatformCheckoutPayment = asyncHandler(async (request, response) => {
  const payload = request.body as CreateCheckoutPaymentInput;
  const result = await createCheckoutPayment(payload);

  response.status(201).json(result);
});
