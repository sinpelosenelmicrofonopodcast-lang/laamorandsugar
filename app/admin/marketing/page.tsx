import { Megaphone, Play } from "lucide-react";

import {
  createMarketingCampaignAction,
  runMarketingAutomationAction
} from "@/actions/marketing";
import { MetricCard } from "@/components/admin/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMarketingAdminData } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminMarketingPage() {
  const data = await getMarketingAdminData();
  const openCarts = data.abandonedCarts.filter((cart) =>
    ["open", "emailed", "push_sent"].includes(cart.status)
  );
  const recoverableCarts = openCarts.filter((cart) => cart.email);
  const sentEmails = data.emailEvents.filter((event) => event.status === "sent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bakery-gold">
            Marketing command center
          </p>
          <h1 className="mt-2 font-serif text-4xl text-foreground">Growth automations</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage Sweet List campaigns, recover abandoned carts, and monitor customer communication.
          </p>
        </div>
        <form action={runMarketingAutomationAction}>
          <Button type="submit" variant="gold">
            <Play className="h-4 w-4" />
            Run automation now
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sweet List" value={data.subscribers.length} helper="Email subscribers available for promos" />
        <MetricCard label="Push Devices" value={data.pushSubscriptions.filter((item) => item.opted_in !== false).length} helper="Devices opted in through OneSignal" />
        <MetricCard label="Recoverable Carts" value={recoverableCarts.length} helper={`${openCarts.length} total open carts`} />
        <MetricCard label="Open Cart Value" value={openCarts.reduce((sum, cart) => sum + Number(cart.subtotal ?? 0), 0)} helper="Potential revenue waiting in carts" currency />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMarketingCampaignAction} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign name</Label>
                <Input id="name" name="name" placeholder="Mother's Day Sweet Drop" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  name="channel"
                  className="flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm"
                  defaultValue="email"
                >
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                  <option value="email_push">Email + Push</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / push headline</Label>
                <Input id="subject" name="subject" placeholder="New luxury treats just dropped" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Limited handcrafted availability this week. Reserve your sweet gift early."
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cta_label">Button label</Label>
                  <Input id="cta_label" name="cta_label" placeholder="Shop now" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_url">Button URL</Label>
                  <Input id="cta_url" name="cta_url" placeholder="/shop" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Schedule time</Label>
                <Input id="scheduled_for" name="scheduled_for" type="datetime-local" />
                <p className="text-xs text-muted-foreground">
                  Leave blank to save as draft. Scheduled campaigns send when automation runs.
                </p>
              </div>
              <Button type="submit" variant="gold">
                <Megaphone className="h-4 w-4" />
                Save campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>{campaign.channel}</TableCell>
                    <TableCell>{campaign.status}</TableCell>
                    <TableCell>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleString("en-US") : "Not sent"}</TableCell>
                  </TableRow>
                ))}
                {data.campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abandoned carts</CardTitle>
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
                {data.abandonedCarts.slice(0, 8).map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>{cart.email ?? "Anonymous"}</TableCell>
                    <TableCell>{formatCurrency(Number(cart.subtotal ?? 0))}</TableCell>
                    <TableCell>{cart.status}</TableCell>
                    <TableCell>{cart.last_seen_at ? new Date(cart.last_seen_at).toLocaleString("en-US") : "Unknown"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent email events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              {sentEmails} sent emails logged recently.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.emailEvents.slice(0, 8).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.email}</TableCell>
                    <TableCell>{event.template_key}</TableCell>
                    <TableCell>{event.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
