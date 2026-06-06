import Link from "next/link";

import { MetricCard } from "@/components/admin/metric-card";
import { SetupNotice } from "@/components/admin/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminDashboardData } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={dashboard.totalRevenue}
          helper="Total sales captured across created orders"
          currency
        />
        <MetricCard
          label="Open Orders"
          value={dashboard.openOrders}
          helper="Orders still in the production or fulfillment pipeline"
        />
        <MetricCard
          label="Pending Quotes"
          value={dashboard.pendingQuotes}
          helper="Custom requests waiting for review or quote response"
        />
        <MetricCard
          label="Avg. Order"
          value={dashboard.averageOrderValue}
          helper="Average order value based on current orders"
          currency
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visits Today"
          value={dashboard.visitsToday}
          helper="Tracked page views since midnight"
        />
        <MetricCard
          label="Visitors 7D"
          value={dashboard.uniqueVisitors7d}
          helper="Unique browser IDs from the last 7 days"
        />
        <MetricCard
          label="Checkout Starts"
          value={dashboard.checkoutStarts7d}
          helper={`7-day checkout conversion: ${(dashboard.conversionRate7d * 100).toFixed(1)}%`}
        />
        <MetricCard
          label="Cart Value"
          value={dashboard.openAbandonedCartValue}
          helper={`${dashboard.openAbandonedCartCount} open carts, ${dashboard.recoverableAbandonedCartCount} with email`}
          currency
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sweet List"
          value={dashboard.newsletterSubscriberCount}
          helper={`${dashboard.newsletterUsedCount} welcome codes redeemed`}
        />
        <MetricCard
          label="Push Audience"
          value={dashboard.pushSubscriberCount}
          helper="Devices opted in for sweet drops and order updates"
        />
        <MetricCard
          label="Products"
          value={dashboard.productCount}
          helper="Published catalog and menu items"
        />
        <MetricCard
          label="Testimonials"
          value={dashboard.testimonialCount}
          helper="Social proof available across the site"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="outline">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
              <p className="text-sm font-medium text-foreground">Top pages this week</p>
              <div className="mt-3 space-y-2">
                {dashboard.topPages7d.length > 0 ? (
                  dashboard.topPages7d.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted-foreground">{page.path}</span>
                      <span className="font-medium text-foreground">{page.views}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No analytics events yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
              <p className="text-sm font-medium text-foreground">Top products this week</p>
              <div className="mt-3 space-y-2">
                {dashboard.topProducts7d.length > 0 ? (
                  dashboard.topProducts7d.map((product) => (
                    <div key={product.slug} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted-foreground">{product.slug}</span>
                      <span className="font-medium text-foreground">{product.views}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Product views will appear after tracking starts.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recoverable carts</CardTitle>
          <Button asChild variant="outline">
            <Link href="/admin/coupons">Sweet List</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentAbandonedCarts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell>{cart.email ?? "Anonymous"}</TableCell>
                  <TableCell>{formatCurrency(Number(cart.subtotal ?? 0))}</TableCell>
                  <TableCell>{cart.status}</TableCell>
                  <TableCell>{new Date(cart.last_seen_at).toLocaleString("en-US")}</TableCell>
                </TableRow>
              ))}
              {dashboard.recentAbandonedCarts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No open abandoned carts yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
