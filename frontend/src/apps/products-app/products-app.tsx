"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { PackagePlus, Search, Sparkles } from "lucide-react";

import { authApi } from "@/lib/api";
import { platformDataCache } from "@/lib/platform-data-cache";
import { cn } from "@/lib/utils";
import type { ProductEditorInput, ProductFormInput } from "@/schemas/product";
import type { PlatformProductItem, PlatformProductsResponse } from "@/types/platform";
import { usePlatformShell } from "@/components/platform/platform-shell-context";

import { ProductCard } from "./product-card";
import { ProductDialog } from "./product-dialog";
import { ProductEditor } from "./product-editor";
import {
  getErrorMessage
} from "./product-utils";

function recalculateMetrics(items: PlatformProductItem[], current: PlatformProductsResponse["metrics"]) {
  const projectedRevenue = items.reduce((total, item) => total + item.price * item.sales, 0);

  return current.map((metric) => {
    if (metric.id === "produtos") {
      return { ...metric, value: items.length };
    }

    if (metric.id === "ativos") {
      return { ...metric, value: items.filter((item) => item.isActive).length };
    }

    if (metric.id === "desativados") {
      return { ...metric, value: items.filter((item) => !item.isActive).length };
    }

    if (metric.id === "projetado") {
      return { ...metric, value: projectedRevenue };
    }

    return metric;
  });
}

export function ProductsApp() {
  const { setHeroVisible } = usePlatformShell();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PlatformProductsResponse | null>(() => platformDataCache.products.get());
  const [loading, setLoading] = useState(() => !platformDataCache.products.hasData());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccessMessage, setEditorSuccessMessage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PlatformProductItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  async function loadProducts(options?: { force?: boolean; silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const response = await platformDataCache.products.load({ force: options?.force });
      setData(response);
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Nao foi possivel carregar os produtos."));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadProducts({ silent: platformDataCache.products.hasData() });
  }, []);

  const visibleItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return data.items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return [item.name, item.id, item.category].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [data, query]);
  const isEditing = Boolean(editingProduct);

  useEffect(() => {
    setHeroVisible(!isEditing);

    return () => {
      setHeroVisible(true);
    };
  }, [isEditing, setHeroVisible]);

  function openCreateDialog() {
    setEditingProduct(null);
    setDialogError(null);
    setFeedback(null);
    setError(null);
    setIsCreateDialogOpen(true);
  }

  function openEditDialog(product: PlatformProductItem) {
    setIsCreateDialogOpen(false);
    setEditingProduct(product);
    setEditorError(null);
    setEditorSuccessMessage(null);
  }

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    setDialogError(null);
  }

  function closeEditor() {
    setEditingProduct(null);
    setEditorError(null);
    setEditorSuccessMessage(null);
  }

  function syncProductInState(nextProduct: PlatformProductItem) {
    setData((current) => {
      if (!current) {
        return current;
      }

      const exists = current.items.some((item) => item.id === nextProduct.id);
      const nextItems = exists
        ? current.items.map((item) => (item.id === nextProduct.id ? nextProduct : item))
        : [nextProduct, ...current.items];
      const nextState = {
        ...current,
        items: nextItems,
        metrics: recalculateMetrics(nextItems, current.metrics)
      };

      platformDataCache.products.set(nextState);
      return nextState;
    });
  }

  async function handleSubmitProduct(values: ProductFormInput) {
    setDialogError(null);
    setIsSaving(true);

    try {
      const payload: ProductFormInput = {
        ...values,
        imageUrl: values.imageUrl?.trim() || undefined,
        salesPageUrl: values.hasSalesPage ? values.salesPageUrl.trim() : "",
        invoiceStatementDescriptor: values.invoiceStatementDescriptor.trim(),
        supportEmail: values.supportEmail.trim(),
        supportPhone: values.supportPhone.trim()
      };

      const response = editingProduct
        ? await authApi.updatePlatformProduct(editingProduct.id, payload)
        : await authApi.createPlatformProduct(payload);

      setFeedback(response.message);
      syncProductInState(response.item);
      closeCreateDialog();
    } catch (submitError) {
      setDialogError(
        getErrorMessage(
          submitError,
          editingProduct
            ? "Nao foi possivel atualizar o produto."
            : "Nao foi possivel criar o produto."
        )
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitProductEditor(values: ProductEditorInput) {
    if (!editingProduct) {
      return;
    }

    setEditorError(null);
    setEditorSuccessMessage(null);
    setIsSaving(true);

    try {
      const payload: ProductEditorInput = {
        ...values,
        imageUrl: values.imageUrl?.trim() || undefined,
        salesPageUrl: values.hasSalesPage ? values.salesPageUrl.trim() : "",
        invoiceStatementDescriptor: values.invoiceStatementDescriptor.trim(),
        supportEmail: values.supportEmail.trim(),
        supportPhone: values.supportPhone.trim(),
        offers: values.offers.map((offer: ProductEditorInput["offers"][number]) => ({
          ...offer,
          description: offer.description.trim()
        })),
        coupons: values.coupons.map((coupon: ProductEditorInput["coupons"][number]) => ({
          ...coupon,
          code: coupon.code.trim().toUpperCase(),
          note: coupon.note.trim()
        }))
      };

      const response = await authApi.updatePlatformProduct(editingProduct.id, payload);
      syncProductInState(response.item);
      setEditingProduct(response.item);
      setEditorSuccessMessage(response.message);
      setFeedback(response.message);
    } catch (submitError) {
      setEditorError(getErrorMessage(submitError, "Nao foi possivel atualizar o produto."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleProduct(product: PlatformProductItem) {
    if (!data) {
      return;
    }

    setTogglingProductId(product.id);
    setFeedback(null);
    setError(null);

    try {
      const response = await authApi.updatePlatformProductActiveState(product.id, !product.isActive);
      setFeedback(response.message);

      startTransition(() => {
        syncProductInState(response.item);
        setEditingProduct((current) => (current?.id === response.item.id ? response.item : current));
      });
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Nao foi possivel alterar o status do produto."));
    } finally {
      setTogglingProductId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="platform-surface rounded-[28px] px-4 py-6 text-sm text-white/56">
        Carregando catalogo de produtos...
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {isEditing ? null : (
        <section className="flex flex-col gap-4">
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.06em] text-white sm:text-[1.9rem]">
            Meus Produtos
          </h2>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex h-12 w-full items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 text-white/48 backdrop-blur-md lg:max-w-[360px]">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou ID"
                className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/26"
              />
            </div>

            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-5 py-3 text-sm font-semibold text-[#171a24] transition hover:brightness-105"
            >
              <PackagePlus className="h-4 w-4" />
              Criar Produto
            </button>
          </div>

          {feedback ? <p className="text-sm text-[#7ee7ba]">{feedback}</p> : null}
          {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
        </section>
      )}

      {isEditing ? (
        <ProductEditor
          product={editingProduct}
          isOpen={isEditing}
          isSubmitting={isSaving}
          error={editorError}
          successMessage={editorSuccessMessage}
          onClose={closeEditor}
          onSubmit={handleSubmitProductEditor}
        />
      ) : isCreateDialogOpen ? (
        <ProductDialog
          product={null}
          isOpen={isCreateDialogOpen}
          isSubmitting={isSaving}
          error={dialogError}
          onClose={closeCreateDialog}
          onSubmit={handleSubmitProduct}
        />
      ) : (
        <>
          <section className="overflow-x-auto pb-3">
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-stretch pr-6 pt-1">
                {visibleItems.map((product, index) => (
                  <div
                    key={product.id}
                    className={cn(
                      "relative w-[236px] flex-none sm:w-[252px] lg:w-[268px]",
                      index === 0 ? "" : "-ml-8 sm:-ml-10 lg:-ml-12"
                    )}
                    style={{ zIndex: index + 1 }}
                  >
                    <ProductCard
                      product={product}
                      isBusy={togglingProductId === product.id}
                      onEdit={openEditDialog}
                      onToggle={(selectedProduct) => void handleToggleProduct(selectedProduct)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {!loading && visibleItems.length === 0 ? (
            <div className="platform-surface-soft rounded-[28px] p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/[0.06] text-[#c4a6ff]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold">Nenhum produto encontrado</p>
                  <p className="mt-1 text-[13px] text-white/48">
                    Ajuste a busca, troque o filtro ou crie um novo produto.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
