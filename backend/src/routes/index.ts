import { Router } from "express";

import { getAdminOverview } from "../controllers/admin.controller";
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resendAccountCode,
  resetPassword,
  verifyAccount
} from "../controllers/auth.controller";
import {
  changePassword,
  deleteAccount,
  updateProfile
} from "../controllers/profile.controller";
import {
  createPlatformProductItem,
  deletePlatformProductItem,
  getPlatformCheckout,
  getPlatformDashboard,
  getPlatformProducts,
  getPlatformSales,
  setPlatformProductItemActiveState,
  updatePlatformProductItem
} from "../controllers/platform.controller";
import { authorizeRoles, requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationCodeSchema,
  resetPasswordSchema,
  verifyAccountCodeSchema
} from "../schemas/auth.schema";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema
} from "../schemas/profile.schema";
import {
  createPlatformProductSchema,
  setPlatformProductActiveSchema,
  updatePlatformProductSchema
} from "../schemas/platform.schema";
import { authRateLimiters, disableSensitiveCaching } from "../security";

export const apiRouter = Router();

apiRouter.post(
  "/auth/register",
  disableSensitiveCaching,
  authRateLimiters.register,
  validateBody(registerSchema),
  register
);
apiRouter.post(
  "/auth/verify-account-code",
  disableSensitiveCaching,
  authRateLimiters.verifyAccountCode,
  validateBody(verifyAccountCodeSchema),
  verifyAccount
);
apiRouter.post(
  "/auth/resend-verification-code",
  disableSensitiveCaching,
  authRateLimiters.resendVerificationCode,
  validateBody(resendVerificationCodeSchema),
  resendAccountCode
);
apiRouter.post("/auth/login", disableSensitiveCaching, authRateLimiters.login, validateBody(loginSchema), login);
apiRouter.post("/auth/logout", disableSensitiveCaching, logout);
apiRouter.post(
  "/auth/forgot-password",
  disableSensitiveCaching,
  authRateLimiters.forgotPassword,
  validateBody(forgotPasswordSchema),
  forgotPassword
);
apiRouter.post(
  "/auth/reset-password",
  disableSensitiveCaching,
  authRateLimiters.resetPassword,
  validateBody(resetPasswordSchema),
  resetPassword
);

apiRouter.get("/me", disableSensitiveCaching, requireAuth, me);
apiRouter.patch("/me/profile", disableSensitiveCaching, requireAuth, validateBody(updateProfileSchema), updateProfile);
apiRouter.post(
  "/me/change-password",
  disableSensitiveCaching,
  requireAuth,
  validateBody(changePasswordSchema),
  changePassword
);
apiRouter.delete(
  "/me/account",
  disableSensitiveCaching,
  requireAuth,
  validateBody(deleteAccountSchema),
  deleteAccount
);
apiRouter.get("/admin/overview", disableSensitiveCaching, requireAuth, authorizeRoles("admin"), getAdminOverview);
apiRouter.get("/platform/checkout/:productId", disableSensitiveCaching, getPlatformCheckout);
apiRouter.get("/platform/dashboard", disableSensitiveCaching, requireAuth, getPlatformDashboard);
apiRouter.get("/platform/products", disableSensitiveCaching, requireAuth, getPlatformProducts);
apiRouter.post(
  "/platform/products",
  disableSensitiveCaching,
  requireAuth,
  validateBody(createPlatformProductSchema),
  createPlatformProductItem
);
apiRouter.patch(
  "/platform/products/:productId",
  disableSensitiveCaching,
  requireAuth,
  validateBody(updatePlatformProductSchema),
  updatePlatformProductItem
);
apiRouter.delete(
  "/platform/products/:productId",
  disableSensitiveCaching,
  requireAuth,
  deletePlatformProductItem
);
apiRouter.patch(
  "/platform/products/:productId/active-state",
  disableSensitiveCaching,
  requireAuth,
  validateBody(setPlatformProductActiveSchema),
  setPlatformProductItemActiveState
);
apiRouter.get("/platform/sales", disableSensitiveCaching, requireAuth, getPlatformSales);
