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

export const apiRouter = Router();

apiRouter.post("/auth/register", validateBody(registerSchema), register);
apiRouter.post("/auth/verify-account-code", validateBody(verifyAccountCodeSchema), verifyAccount);
apiRouter.post(
  "/auth/resend-verification-code",
  validateBody(resendVerificationCodeSchema),
  resendAccountCode
);
apiRouter.post("/auth/login", validateBody(loginSchema), login);
apiRouter.post("/auth/logout", logout);
apiRouter.post("/auth/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
apiRouter.post("/auth/reset-password", validateBody(resetPasswordSchema), resetPassword);

apiRouter.get("/me", requireAuth, me);
apiRouter.patch("/me/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);
apiRouter.post("/me/change-password", requireAuth, validateBody(changePasswordSchema), changePassword);
apiRouter.delete("/me/account", requireAuth, validateBody(deleteAccountSchema), deleteAccount);
apiRouter.get("/admin/overview", requireAuth, authorizeRoles("admin"), getAdminOverview);
apiRouter.get("/platform/dashboard", requireAuth, getPlatformDashboard);
apiRouter.get("/platform/products", requireAuth, getPlatformProducts);
apiRouter.post(
  "/platform/products",
  requireAuth,
  validateBody(createPlatformProductSchema),
  createPlatformProductItem
);
apiRouter.patch(
  "/platform/products/:productId",
  requireAuth,
  validateBody(updatePlatformProductSchema),
  updatePlatformProductItem
);
apiRouter.patch(
  "/platform/products/:productId/active-state",
  requireAuth,
  validateBody(setPlatformProductActiveSchema),
  setPlatformProductItemActiveState
);
apiRouter.get("/platform/sales", requireAuth, getPlatformSales);
