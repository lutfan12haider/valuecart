"use client";

import { useState } from "react";
import AddToCartForm from "./AddToCartForm";
import { formatUsdt } from "@/lib/currency";

type Variant = {
  id: string;
  sku: string;
  options: unknown;
  basePrice: number | null;
  stock: number;
  reserved: number;
};

type Props = {
  productId: string;
  basePrice: number;
  salePrice: number | null;
  productStock: number;
  productReserved: number;
  variants: Variant[];
};

export default function ProductActions({
  productId,
  basePrice,
  salePrice,
  productStock,
  productReserved,
  variants
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  );

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  // Price: variant override > sale > base
  const displayPrice = selected?.basePrice != null && selected.basePrice > 0
    ? selected.basePrice
    : (salePrice ?? basePrice);

  const available = selected
    ? selected.stock - selected.reserved
    : productStock - productReserved;

  // Group options by key (e.g. { Color: ["Red","Blue"], Size: ["S","M","L"] })
  const optionGroups: Record<string, { label: string; variantId: string; available: boolean }[]> = {};
  for (const v of variants) {
    const opts = v.options && typeof v.options === "object" ? v.options as Record<string, string> : {};
    for (const [key, value] of Object.entries(opts)) {
      if (!optionGroups[key]) optionGroups[key] = [];
      if (!optionGroups[key].some((o) => o.label === value)) {
        optionGroups[key].push({
          label: value,
          variantId: v.id,
          available: v.stock - v.reserved > 0
        });
      }
    }
  }

  const hasVariants = variants.length > 0;

  return (
    <div className="space-y-4">
      {/* Display price (updates when variant selected) */}
      <p className="text-3xl font-extrabold text-brand">{formatUsdt(displayPrice)}</p>

      {/* Variant selectors */}
      {hasVariants && Object.entries(optionGroups).map(([key, options]) => (
        <div key={key} className="space-y-2">
          <p className="text-sm font-medium">
            {key}
            {selected && (
              <span className="ml-2 font-normal text-slate-500">
                — {(selected.options as Record<string, string>)[key]}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = selectedId === opt.variantId;
              return (
                <button
                  key={opt.variantId}
                  type="button"
                  onClick={() => setSelectedId(opt.variantId)}
                  disabled={!opt.available}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition
                    ${isSelected ? "border-brand bg-brand text-white" : "border-slate-300 bg-white"}
                    ${!opt.available ? "opacity-40 line-through cursor-not-allowed" : "hover:border-brand"}
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Must select variant if variants exist */}
      {hasVariants && !selected && variants.length > 1 && (
        <p className="text-sm text-amber-600">Please select an option above.</p>
      )}

      <AddToCartForm
        productId={productId}
        variantId={selected?.id}
        maxQuantity={available}
        disabled={hasVariants && !selected && variants.length > 1}
      />
    </div>
  );
}
