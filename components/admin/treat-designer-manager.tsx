"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import {
  upsertTreatAddOnAction,
  upsertTreatDesignerProductAction,
  upsertTreatOptionAction,
  upsertTreatOptionGroupAction,
  upsertTreatSprinkleSetAction
} from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TreatDesignerConfig, TreatDesignerOrder, TreatDesignerProduct } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

function readBool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function TreatDesignerManager({
  config,
  orders
}: {
  config: TreatDesignerConfig;
  orders: TreatDesignerOrder[];
}) {
  const [isPending, startTransition] = useTransition();
  const groups = useMemo(
    () => config.products.flatMap((product) => product.option_groups.map((group) => ({ ...group, product }))),
    [config.products]
  );

  function runAction(action: () => Promise<{ success?: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Treat Designer updated");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
            Treat Designer
          </p>
          <CardTitle>Designer products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              runAction(() =>
                upsertTreatDesignerProductAction({
                  name: getString(formData, "name"),
                  base_price: getString(formData, "base_price"),
                  min_quantity: getString(formData, "min_quantity") || "6",
                  image: getString(formData, "image"),
                  treat_designer_enabled: true,
                  treat_designer_featured: readBool(formData, "treat_designer_featured"),
                  enable_sprinkles: readBool(formData, "enable_sprinkles"),
                  enable_logo_upload: readBool(formData, "enable_logo_upload"),
                  enable_live_preview: true,
                  logo_upload_fee: getString(formData, "logo_upload_fee") || "0"
                })
              );
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-product-name">Product</Label>
              <Input id="new-product-name" name="name" placeholder="Cake Pop" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product-price">Base price</Label>
              <Input id="new-product-price" name="base_price" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product-min">Min qty</Label>
              <Input id="new-product-min" name="min_quantity" type="number" min="1" defaultValue="6" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product-image">Image URL</Label>
              <Input id="new-product-image" name="image" placeholder="https://..." />
            </div>
            <div className="flex items-end">
              <label className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 text-sm">
                <input type="checkbox" name="treat_designer_featured" className="h-4 w-4" />
                Featured
              </label>
            </div>
            <div className="space-y-2">
              <Label>Logo fee</Label>
              <Input name="logo_upload_fee" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <div className="flex flex-wrap items-end gap-3 md:col-span-4">
              <label className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 text-sm">
                <input type="checkbox" name="enable_sprinkles" className="h-4 w-4" />
                Sprinkles
              </label>
              <label className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 text-sm">
                <input type="checkbox" name="enable_logo_upload" className="h-4 w-4" />
                Logo upload
              </label>
            </div>
            <div className="md:col-span-5">
              <Button type="submit" variant="gold" disabled={isPending}>
                Add product
              </Button>
            </div>
          </form>

          <div className="grid gap-4">
            {config.products.map((product) => (
              <ProductAdminCard
                key={product.id}
                product={product}
                isPending={isPending}
                runAction={runAction}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Option groups and options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              runAction(() =>
                upsertTreatOptionGroupAction({
                  product_id: getString(formData, "product_id"),
                  name: getString(formData, "name"),
                  required: readBool(formData, "required"),
                  active: true,
                  sort_order: getString(formData, "sort_order") || "0"
                })
              );
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-2">
              <Label>Product</Label>
              <select name="product_id" className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm" required>
                <option value="">Choose product</option>
                {config.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Group name</Label>
              <Input name="name" placeholder="Flavor, Color, Style" required />
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" min="0" defaultValue="0" />
            </div>
            <div className="flex items-end">
              <label className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-white/80 px-4 text-sm">
                <input type="checkbox" name="required" className="h-4 w-4" />
                Required
              </label>
            </div>
            <div className="md:col-span-4">
              <Button type="submit" variant="gold" disabled={isPending}>
                Add option group
              </Button>
            </div>
          </form>

          <form
            className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              runAction(() =>
                upsertTreatOptionAction({
                  group_id: getString(formData, "group_id"),
                  name: getString(formData, "name"),
                  price_modifier: getString(formData, "price_modifier") || "0",
                  image: getString(formData, "image"),
                  color_hex: getString(formData, "color_hex"),
                  active: true,
                  sort_order: getString(formData, "sort_order") || "0"
                })
              );
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Group</Label>
              <select name="group_id" className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm" required>
                <option value="">Choose group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.product.name} - {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Option</Label>
              <Input name="name" placeholder="Vanilla" required />
            </div>
            <div className="space-y-2">
              <Label>Modifier</Label>
              <Input name="price_modifier" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label>Color hex</Label>
              <Input name="color_hex" placeholder="#f4b6c4" />
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2 md:col-span-6">
              <Label>Image URL</Label>
              <Input name="image" placeholder="Optional preview image override" />
            </div>
            <div className="md:col-span-6">
              <Button type="submit" variant="gold" disabled={isPending}>
                Add option
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global add-ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[1fr_160px_120px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              runAction(() =>
                upsertTreatAddOnAction({
                  name: getString(formData, "name"),
                  price: getString(formData, "price") || "0",
                  active: true,
                  sort_order: getString(formData, "sort_order") || "0"
                })
              );
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="Logo/image setup" required />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input name="price" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" min="0" defaultValue="0" />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="gold" disabled={isPending}>
                Add add-on
              </Button>
            </div>
          </form>

          <div className="grid gap-3">
            {config.addOns.map((addOn) => (
              <form
                key={addOn.id}
                className="grid gap-3 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[1fr_140px_120px_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);

                  runAction(() =>
                    upsertTreatAddOnAction({
                      id: addOn.id,
                      name: getString(formData, "name"),
                      price: getString(formData, "price") || "0",
                      active: readBool(formData, "active"),
                      sort_order: getString(formData, "sort_order") || "0"
                    })
                  );
                }}
              >
                <Input name="name" defaultValue={addOn.name} />
                <Input name="price" type="number" min="0" step="0.01" defaultValue={addOn.price} />
                <Input name="sort_order" type="number" min="0" defaultValue={addOn.sort_order} />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={addOn.active} className="h-4 w-4" />
                    Active
                  </label>
                  <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                    Save
                  </Button>
                </div>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sprinkle sets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[1fr_160px_160px_120px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              runAction(() =>
                upsertTreatSprinkleSetAction({
                  name: getString(formData, "name"),
                  image_url: getString(formData, "image_url"),
                  color_hex: getString(formData, "color_hex"),
                  price_modifier: getString(formData, "price_modifier") || "0",
                  active: true,
                  sort_order: getString(formData, "sort_order") || "0"
                })
              );
              event.currentTarget.reset();
            }}
          >
            <Input name="name" placeholder="Rose Gold Confetti" required />
            <Input name="color_hex" placeholder="#c59b45" />
            <Input name="price_modifier" type="number" min="0" step="0.01" defaultValue="0" />
            <Input name="sort_order" type="number" min="0" defaultValue="0" />
            <Button type="submit" variant="gold" disabled={isPending}>
              Add
            </Button>
            <div className="md:col-span-5">
              <Input name="image_url" placeholder="Optional sprinkle texture image URL" />
            </div>
          </form>

          <div className="grid gap-3">
            {config.sprinkleSets.map((sprinkleSet) => (
              <form
                key={sprinkleSet.id}
                className="grid gap-3 rounded-2xl border border-border bg-white/70 p-4 md:grid-cols-[1fr_140px_140px_110px_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);

                  runAction(() =>
                    upsertTreatSprinkleSetAction({
                      id: sprinkleSet.id,
                      name: getString(formData, "name"),
                      image_url: getString(formData, "image_url"),
                      color_hex: getString(formData, "color_hex"),
                      price_modifier: getString(formData, "price_modifier") || "0",
                      active: readBool(formData, "active"),
                      sort_order: getString(formData, "sort_order") || "0"
                    })
                  );
                }}
              >
                <Input name="name" defaultValue={sprinkleSet.name} />
                <Input name="color_hex" defaultValue={sprinkleSet.color_hex ?? ""} />
                <Input name="price_modifier" type="number" min="0" step="0.01" defaultValue={sprinkleSet.price_modifier} />
                <Input name="sort_order" type="number" min="0" defaultValue={sprinkleSet.sort_order} />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={sprinkleSet.active} className="h-4 w-4" />
                    Active
                  </label>
                  <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                    Save
                  </Button>
                </div>
                <div className="md:col-span-5">
                  <Input name="image_url" defaultValue={sprinkleSet.image_url ?? ""} placeholder="Texture image URL" />
                </div>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent designer requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Treat Designer requests yet.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-border bg-white/70 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    {order.preview_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.preview_image_url}
                        alt=""
                        className="h-16 w-16 rounded-xl border border-border object-cover"
                      />
                    ) : null}
                    <div>
                    <p className="font-medium text-foreground">
                      {order.products?.name ?? "Deleted product"} · Qty {order.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-US")}
                    </p>
                    </div>
                  </div>
                  <p className="font-serif text-3xl text-bakery-rose">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
                <RequestJson label="Options" value={order.selected_options} />
                <RequestJson label="Add-ons" value={order.add_ons} />
                {order.custom_notes ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">Notes:</span> {order.custom_notes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestJson({ label, value }: { label: string; value: unknown }) {
  const rows = Array.isArray(value) ? value : [];

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {rows.map((row, index) => {
          const item = row && typeof row === "object" ? (row as { groupName?: string; name?: string }) : {};

          return (
            <span key={`${label}-${index}`} className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
              {[item.groupName, item.name].filter(Boolean).join(": ") || JSON.stringify(row)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ProductAdminCard({
  product,
  isPending,
  runAction
}: {
  product: TreatDesignerProduct;
  isPending: boolean;
  runAction: (action: () => Promise<{ success?: boolean; error?: string }>) => void;
}) {
  return (
    <form
      className="rounded-2xl border border-border bg-white/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        runAction(() =>
          upsertTreatDesignerProductAction({
            id: product.id,
            name: getString(formData, "name"),
            base_price: getString(formData, "base_price"),
            min_quantity: getString(formData, "min_quantity"),
            image: getString(formData, "image"),
            treat_designer_enabled: readBool(formData, "treat_designer_enabled"),
            treat_designer_featured: readBool(formData, "treat_designer_featured"),
            enable_sprinkles: readBool(formData, "enable_sprinkles"),
            enable_logo_upload: readBool(formData, "enable_logo_upload"),
            enable_live_preview: readBool(formData, "enable_live_preview"),
            logo_upload_fee: getString(formData, "logo_upload_fee") || "0"
          })
        );
      }}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_130px_110px_120px_1fr_auto]">
        <Input name="name" defaultValue={product.name} />
        <Input name="base_price" type="number" min="0" step="0.01" defaultValue={product.base_price} />
        <Input name="min_quantity" type="number" min="1" defaultValue={product.min_quantity} />
        <Input name="logo_upload_fee" type="number" min="0" step="0.01" defaultValue={product.logo_upload_fee} />
        <Input name="image" defaultValue={product.image ?? ""} placeholder="Image URL" />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          Save
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="treat_designer_enabled" defaultChecked={product.treat_designer_enabled} className="h-4 w-4" />
          Enabled
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="treat_designer_featured" defaultChecked={product.treat_designer_featured} className="h-4 w-4" />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enable_sprinkles" defaultChecked={product.enable_sprinkles} className="h-4 w-4" />
          Sprinkles
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enable_logo_upload" defaultChecked={product.enable_logo_upload} className="h-4 w-4" />
          Logo upload
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enable_live_preview" defaultChecked={product.enable_live_preview} className="h-4 w-4" />
          Live preview
        </label>
        <Badge variant="outline">{formatCurrency(product.base_price)}</Badge>
        <Badge variant="outline">{product.option_groups.length} groups</Badge>
      </div>
      {product.option_groups.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {product.option_groups.map((group) => (
            <div key={group.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {group.name} {group.required ? "(required)" : ""}
                </span>
                <span className="text-muted-foreground">{group.options.length} options</span>
              </div>
              {group.options.length > 0 ? (
                <p className="mt-2 text-muted-foreground">
                  {group.options
                    .map((option) =>
                      option.price_modifier > 0
                        ? `${option.name} (+${formatCurrency(option.price_modifier)})`
                        : option.name
                    )
                    .join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </form>
  );
}
