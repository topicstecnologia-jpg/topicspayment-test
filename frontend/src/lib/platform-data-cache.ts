import { authApi } from "./api";
import type {
  PlatformDashboardResponse,
  PlatformProductsResponse,
  PlatformSalesResponse
} from "@/types/platform";

const CACHE_TTL_MS = 45_000;

type CacheEntry<T> = {
  data: T | null;
  promise: Promise<T> | null;
  updatedAt: number;
};

function createCache<T>(loader: () => Promise<T>) {
  const entry: CacheEntry<T> = {
    data: null,
    promise: null,
    updatedAt: 0
  };

  function hasFreshData() {
    return entry.data !== null && Date.now() - entry.updatedAt < CACHE_TTL_MS;
  }

  async function load(options?: { force?: boolean }) {
    if (!options?.force && hasFreshData()) {
      return entry.data as T;
    }

    if (!options?.force && entry.promise) {
      return entry.promise;
    }

    const nextPromise = loader()
      .then((response) => {
        entry.data = response;
        entry.updatedAt = Date.now();
        return response;
      })
      .finally(() => {
        entry.promise = null;
      });

    entry.promise = nextPromise;

    return nextPromise;
  }

  return {
    get() {
      return entry.data;
    },
    hasData() {
      return entry.data !== null;
    },
    async load(options?: { force?: boolean }) {
      return load(options);
    },
    prefetch() {
      return load().then(() => undefined);
    },
    set(data: T) {
      entry.data = data;
      entry.updatedAt = Date.now();
      entry.promise = null;
    },
    clear() {
      entry.data = null;
      entry.updatedAt = 0;
      entry.promise = null;
    }
  };
}

export const platformDataCache = {
  dashboard: createCache<PlatformDashboardResponse>(() => authApi.getPlatformDashboard()),
  products: createCache<PlatformProductsResponse>(() => authApi.getPlatformProducts()),
  sales: createCache<PlatformSalesResponse>(() => authApi.getPlatformSales())
};

export function prefetchPlatformData() {
  return Promise.allSettled([
    platformDataCache.dashboard.prefetch(),
    platformDataCache.products.prefetch(),
    platformDataCache.sales.prefetch()
  ]);
}
