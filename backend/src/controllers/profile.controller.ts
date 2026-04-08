import { authCookieOptions } from "../config/cookies";
import { clearAuthCookieOptions } from "../config/cookies";
import { env } from "../config/env";
import { buildSessionFingerprint, getSessionFingerprintContext } from "../security";
import { getClientIp } from "../security/config";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput
} from "../schemas/profile.schema";
import { createSessionForUser } from "../services/auth.service";
import {
  changeUserPassword,
  deleteUserAccount,
  updateUserProfile
} from "../services/profile.service";
import { asyncHandler } from "../utils/async-handler";

export const updateProfile = asyncHandler(async (request, response) => {
  const payload = request.body as UpdateProfileInput;
  const user = await updateUserProfile(request.user!.id, payload);

  response.json({
    message: "Perfil atualizado com sucesso.",
    user
  });
});

export const changePassword = asyncHandler(async (request, response) => {
  const payload = request.body as ChangePasswordInput;
  const user = await changeUserPassword(request.user!.id, payload);
  const session = createSessionForUser(user, {
    fingerprint: buildSessionFingerprint(getSessionFingerprintContext(request)),
    ipAddress: getClientIp(request)
  });

  response.cookie(env.AUTH_COOKIE_NAME, session.token, authCookieOptions);
  response.json({
    message: "Senha atualizada com sucesso.",
    user: session.user
  });
});

export const deleteAccount = asyncHandler(async (request, response) => {
  const payload = request.body as DeleteAccountInput;
  await deleteUserAccount(request.user!.id, payload);

  response.clearCookie(env.AUTH_COOKIE_NAME, clearAuthCookieOptions);
  response.status(204).send();
});
