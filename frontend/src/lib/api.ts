import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationCodeInput,
  ResetPasswordInput,
  VerifyAccountCodeInput
} from "@/schemas/auth";
import type {
  AdminOverview,
  AuthResponse,
  ForgotPasswordResponse,
  MeResponse,
  RegisterResponse,
  VerificationCodeResponse
} from "@/types/auth";
import type {
  PlatformDashboardResponse,
  PlatformProductDeleteResponse,
  PlatformProductMutationResponse,
  PlatformProductsResponse,
  PlatformSalesResponse
} from "@/types/platform";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput
} from "@/schemas/profile";
import type { ProductFormInput } from "@/schemas/product";

import { API_URL } from "./constants";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const REQUEST_TIMEOUT_MS = 10000;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (init?.signal) {
    init.signal.addEventListener(
      "abort",
      () => {
        controller.abort();
      },
      { once: true }
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    window.clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("A conexao com a API expirou. Tente novamente.", 408);
    }

    throw error;
  }

  window.clearTimeout(timeoutId);

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? ((await response.json()) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      typeof data.message === "string" ? data.message : "Request failed.",
      response.status,
      data.details
    );
  }

  return data as T;
}

export const authApi = {
  login(values: LoginInput) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  register(values: RegisterInput) {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  verifyAccountCode(values: VerifyAccountCodeInput) {
    return apiRequest<AuthResponse>("/auth/verify-account-code", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  resendVerificationCode(values: ResendVerificationCodeInput) {
    return apiRequest<VerificationCodeResponse>("/auth/resend-verification-code", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  async logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      throw new ApiError("Nao foi possivel encerrar a sessao.", response.status);
    }
  },

  me() {
    return apiRequest<MeResponse>("/me");
  },

  forgotPassword(values: ForgotPasswordInput) {
    return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  resetPassword(values: ResetPasswordInput) {
    return apiRequest<AuthResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  updateProfile(values: UpdateProfileInput) {
    return apiRequest<AuthResponse>("/me/profile", {
      method: "PATCH",
      body: JSON.stringify(values)
    });
  },

  changePassword(values: ChangePasswordInput) {
    return apiRequest<AuthResponse>("/me/change-password", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  async deleteAccount(values: DeleteAccountInput) {
    const response = await fetch(`${API_URL}/me/account`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = isJson ? ((await response.json()) as Record<string, unknown>) : {};

      throw new ApiError(
        typeof data.message === "string" ? data.message : "Nao foi possivel excluir a conta.",
        response.status,
        data.details
      );
    }
  },

  getAdminOverview() {
    return apiRequest<AdminOverview>("/admin/overview");
  },

  getPlatformDashboard() {
    return apiRequest<PlatformDashboardResponse>("/platform/dashboard");
  },

  getPlatformProducts() {
    return apiRequest<PlatformProductsResponse>("/platform/products");
  },

  createPlatformProduct(values: ProductFormInput) {
    return apiRequest<PlatformProductMutationResponse>("/platform/products", {
      method: "POST",
      body: JSON.stringify(values)
    });
  },

  updatePlatformProduct(productId: string, values: ProductFormInput) {
    return apiRequest<PlatformProductMutationResponse>(`/platform/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(values)
    });
  },

  deletePlatformProduct(productId: string) {
    return apiRequest<PlatformProductDeleteResponse>(`/platform/products/${productId}`, {
      method: "DELETE"
    });
  },

  updatePlatformProductActiveState(productId: string, isActive: boolean) {
    return apiRequest<PlatformProductMutationResponse>(
      `/platform/products/${productId}/active-state`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      }
    );
  },

  getPlatformSales() {
    return apiRequest<PlatformSalesResponse>("/platform/sales");
  }
};
