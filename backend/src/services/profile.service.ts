import {
  deleteUserRecord,
  findUserByEmail,
  findUserById,
  incrementUserSessionVersion,
  toSafeUser,
  updateUserRecord
} from "../lib/app-repository";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput
} from "../schemas/profile.schema";
import { AppError } from "../utils/app-error";
import { comparePassword, hashPassword } from "../utils/password";

function normalizeOptionalString(value?: string) {
  return value?.trim() || null;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (normalizedEmail !== currentUser.email) {
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new AppError("Ja existe uma conta com este e-mail.", 409);
    }
  }

  const user = await updateUserRecord(userId, {
    name: input.name.trim(),
    email: normalizedEmail,
    phone: normalizeOptionalString(input.phone),
    address: normalizeOptionalString(input.address),
    avatarUrl: normalizeOptionalString(input.avatarUrl)
  });

  return toSafeUser(user);
}

export async function changeUserPassword(userId: string, input: ChangePasswordInput) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  const isPasswordValid = await comparePassword(input.currentPassword, currentUser.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Senha atual incorreta.", 400);
  }

  const isSamePassword = await comparePassword(input.newPassword, currentUser.passwordHash);

  if (isSamePassword) {
    throw new AppError("A nova senha precisa ser diferente da senha atual.", 400);
  }

  const passwordHash = await hashPassword(input.newPassword);

  await updateUserRecord(userId, {
    passwordHash
  });
  await incrementUserSessionVersion(userId);
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  return user;
}

export async function deleteUserAccount(userId: string, input: DeleteAccountInput) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  const isPasswordValid = await comparePassword(input.password, currentUser.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Senha incorreta. Nao foi possivel excluir a conta.", 400);
  }

  await deleteUserRecord(userId);
}
