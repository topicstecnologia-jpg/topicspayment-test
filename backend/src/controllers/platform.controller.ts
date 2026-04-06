import {
  createPlatformProduct,
  getDashboardPayload,
  getProductsPayload,
  getSalesPayload,
  updatePlatformProduct,
  updatePlatformProductActiveState
} from "../services/platform.service";
import type {
  CreatePlatformProductInput,
  SetPlatformProductActiveInput,
  UpdatePlatformProductInput
} from "../schemas/platform.schema";
import { asyncHandler } from "../utils/async-handler";

export const getPlatformDashboard = asyncHandler(async (request, response) => {
  response.json(await getDashboardPayload(request.user!));
});

export const getPlatformProducts = asyncHandler(async (request, response) => {
  response.json(await getProductsPayload(request.user!.id));
});

export const createPlatformProductItem = asyncHandler(async (request, response) => {
  const payload = request.body as CreatePlatformProductInput;
  const item = await createPlatformProduct(request.user!.id, payload);

  response.status(201).json({
    message: "Produto criado com sucesso.",
    item
  });
});

export const updatePlatformProductItem = asyncHandler(async (request, response) => {
  const payload = request.body as UpdatePlatformProductInput;
  const productId = request.params.productId;
  const item = await updatePlatformProduct(request.user!.id, productId, payload);

  response.json({
    message: "Produto atualizado com sucesso.",
    item
  });
});

export const setPlatformProductItemActiveState = asyncHandler(async (request, response) => {
  const payload = request.body as SetPlatformProductActiveInput;
  const productId = request.params.productId;
  const item = await updatePlatformProductActiveState(request.user!.id, productId, payload.isActive);

  response.json({
    message: payload.isActive ? "Produto ativado com sucesso." : "Produto desativado com sucesso.",
    item
  });
});

export const getPlatformSales = asyncHandler(async (request, response) => {
  response.json(await getSalesPayload(request.user!));
});
