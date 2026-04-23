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
            <CardTitle>Quick stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
              <p className="text-sm text-muted-foreground">Published products</p>
              <p className="mt-2 font-serif text-4xl">{dashboard.productCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/70 px-5 py-4">
              <p className="text-sm text-muted-foreground">Testimonials</p>
              <p className="mt-2 font-serif text-4xl">{dashboard.testimonialCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
