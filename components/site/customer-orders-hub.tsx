"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deriveCustomerOrderStatus, getPaymentStatusLabel } from "@/lib/order-status";
import type { CustomerAccountOrder, ProfileRow } from "@/lib/types/app";
import { formatCurrency } from "@/lib/utils";

export function CustomerOrdersHub({
  profile,
  email,
  orders
}: {
  profile: ProfileRow | null;
  email: string;
  orders: CustomerAccountOrder[];
}) {
  return (
    <div className="space-y-8">
      <Card className="border-white/70 bg-white/85 shadow-card">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Your account
          </p>
          <CardTitle>{profile?.full_name || "Your sweet order hub"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email</p>
            <p className="mt-2 font-medium text-foreground">{email}</p>
          </div>
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Phone</p>
            <p className="mt-2 font-medium text-foreground">
              {profile?.phone?.trim() || "Add your phone during checkout"}
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-secondary/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Orders</p>
            <p className="mt-2 font-medium text-foreground">{orders.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
              My orders
            </p>
            <h1 className="font-serif text-4xl text-foreground sm:text-5xl">
              Track every sweet moment
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              View progress, check payment status, and keep communication in one place.
            </p>
          </div>
          <Button asChild variant="gold">
            <Link href="/shop">Shop treats</Link>
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="border-dashed border-bakery-gold/30 bg-white/70 shadow-card">
            <CardContent className="space-y-4 p-8 text-center">
              <h2 className="font-serif text-3xl text-foreground">No orders yet</h2>
              <p className="text-muted-foreground">
                Once you place your first order, tracking and messages will show up here.
              </p>
              <Button asChild variant="gold">
                <Link href="/shop">Start your order</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const status = deriveCustomerOrderStatus({
                order_status: order.order_status,
                status: order.status,
                payment_status: order.payment_status
              });
              const unreadAdminMessages = (order.order_messages ?? []).filter(
                (message) =>
                  (message.sender_type === "admin" || message.sender_type === "system") &&
                  !message.is_read
              ).length;

              return (
                <Card key={order.id} className="border-white/70 bg-white/85 shadow-card">
                  <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-serif text-2xl text-foreground">{order.order_number}</p>
                        <StatusBadge status={status} />
                        {unreadAdminMessages > 0 ? (
                          <span className="rounded-full bg-bakery-rose/10 px-3 py-1 text-xs font-semibold text-bakery-rose">
                            {unreadAdminMessages} new update{unreadAdminMessages === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{new Date(order.created_at).toLocaleDateString("en-US")}</span>
                        <span className="capitalize">{order.fulfillment_method}</span>
                        <span>{order.fulfillment_date}</span>
                        {order.fulfillment_time_slot ? <span>{order.fulfillment_time_slot}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm">
                        <span className="text-muted-foreground">
                          Payment: <strong className="text-foreground">{getPaymentStatusLabel(order.payment_status)}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Total: <strong className="text-foreground">{formatCurrency(order.total)}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Items: <strong className="text-foreground">{order.order_items.length}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {order.order_access_token ? (
                        <Button asChild variant="outline">
                          <Link href={`/order-status/${order.order_access_token}`}>Open order</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          Tracking unavailable
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
