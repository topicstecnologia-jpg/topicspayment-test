import {
  createPlatformProduct,
  deletePlatformProduct,
  getCheckoutPayload,
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

export const getPlatformCheckout = asyncHandler(async (request, response) => {
  const productId = request.params.productId;
  const offerId = typeof request.query.offer === "string" ? request.query.offer : undefined;

  response.json(await getCheckoutPayload(productId, offerId));
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

export const deletePlatformProductItem = asyncHandler(async (request, response) => {
  const productId = request.params.productId;
  const item = await deletePlatformProduct(request.user!.id, productId);

  response.json({
    message: "Produto excluído com sucesso.",
    productId: item.id
  });
});

export const getPlatformSales = asyncHandler(async (request, response) => {
  response.json(await getSalesPayload(request.user!));
});
