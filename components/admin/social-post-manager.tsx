"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Clock3,
  PauseCircle,
  PencilLine,
  PlayCircle,
  Rocket,
  Sparkles,
  Trash2,
  WandSparkles
} from "lucide-react";
import { toast } from "sonner";

import {
  cancelSocialPostAction,
  createManualSocialDraftAction,
  deleteSocialPostAction,
  generateSocialQueueAction,
  getSocialAutomationDiagnosticsAction,
  publishSocialPostNowAction,
  refreshSocialMetricsAction,
  runSocialAutomationNowAction,
  updateSocialPostAction,
  upsertSocialPostSettingsAction
} from "@/actions/social-posts";
import type {
  Json,
  SocialPlatform,
  SocialPostModel,
  SocialPostSettingsModel
} from "@/lib/types/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SocialPostManagerProps = {
  settings: SocialPostSettingsModel;
  queue: SocialPostModel[];
  history: SocialPostModel[];
  integrations: {
    supabase: boolean;
    openai: boolean;
    metaAccessToken: boolean;
    facebookPage: boolean;
    instagramAccount: boolean;
    cronSecret: boolean;
  };
  diagnostics: {
    dueCount: number;
    overdueCount: number;
    nextScheduledFor: string | null;
    lastError: string | null;
  };
  summary: {
    queuedCount: number;
    publishedCount: number;
    failedCount: number;
  };
};

type EditablePostState = {
  id: string;
  scheduled_for: string;
  platforms: SocialPlatform[];
  image_url: string;
  product_name: string;
  product_price: string;
  product_description: string;
  caption_en: string;
  caption_es: string;
  cta_en: string;
  cta_es: string;
  hashtags_text: string;
  combined_caption: string;
};

function deepCloneSettings(settings: SocialPostSettingsModel): SocialPostSettingsModel {
  return {
    ...settings,
    schedule_entries: settings.schedule_entries.map((entry) => ({ ...entry, platforms: [...entry.platforms] })),
    required_lines: [...settings.required_lines],
    cta_phrases_en: [...settings.cta_phrases_en],
    cta_phrases_es: [...settings.cta_phrases_es],
    default_hashtags: [...settings.default_hashtags]
  };
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => input.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toEditablePost(post: SocialPostModel): EditablePostState {
  return {
    id: post.id,
    scheduled_for: toDatetimeLocal(post.scheduled_for),
    platforms: [...post.platforms],
    image_url: post.image_url,
    product_name: post.product_name,
    product_price: typeof post.product_price === "number" ? String(post.product_price) : "",
    product_description: post.product_description ?? "",
    caption_en: post.caption_en,
    caption_es: post.caption_es,
    cta_en: post.cta_en ?? "",
    cta_es: post.cta_es ?? "",
    hashtags_text: post.hashtags.join(", "),
    combined_caption: post.combined_caption
  };
}

function splitListInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Draft";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
}

function getStatusBadgeVariant(status: SocialPostModel["status"]) {
  switch (status) {
    case "published":
      return "gold";
    case "failed":
      return "rose";
    case "canceled":
      return "outline";
    default:
      return "secondary";
  }
}

function summarizeMetrics(value: Record<string, Json> | null) {
  if (!value) {
    return null;
  }

  return Object.entries(value)
    .filter(([, metric]) => metric !== null && metric !== undefined)
    .map(([key, metric]) => `${key}: ${metric}`)
    .join(" · ");
}

function buildCombinedCaptionPreview(post: EditablePostState) {
  const hashtags = splitListInput(post.hashtags_text).map((tag) => `#${tag.replace(/^#/, "")}`);
  const hashtagLine = hashtags.length > 0 ? `\n\n${hashtags.join(" ")}` : "";

  return `${post.caption_en.trim()}\n\n${post.caption_es.trim()}${hashtagLine}`;
}

function addPlatform(platforms: SocialPlatform[], platform: SocialPlatform) {
  return [...new Set([...platforms, platform])] as SocialPlatform[];
}

function removePlatform(platforms: SocialPlatform[], platform: SocialPlatform) {
  return platforms.filter((item) => item !== platform) as SocialPlatform[];
}

function IntegrationPill({
  label,
  enabled
}: {
  label: string;
  enabled: boolean;
}) {
  return <Badge variant={enabled ? "gold" : "outline"}>{enabled ? `${label} ready` : `${label} missing`}</Badge>;
}

export function SocialPostManager({
  settings,
  queue,
  history,
  integrations,
  diagnostics,
  summary
}: SocialPostManagerProps) {
  const [draftSettings, setDraftSettings] = useState(() => deepCloneSettings(settings));
  const [editingPost, setEditingPost] = useState<EditablePostState | null>(null);
  const [currentDiagnostics, setCurrentDiagnostics] = useState(diagnostics);
  const [isPending, startTransition] = useTransition();

  const queueRows = useMemo(
    () => [...queue].sort((left, right) => (left.scheduled_for ?? "").localeCompare(right.scheduled_for ?? "")),
    [queue]
  );
  const historyRows = useMemo(
    () => [...history].sort((left, right) => (right.published_at ?? right.created_at).localeCompare(left.published_at ?? left.created_at)),
    [history]
  );

  const saveSettings = () => {
    startTransition(async () => {
      const result = await upsertSocialPostSettingsAction(draftSettings);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Social automation settings updated");
    });
  };

  const runAction = (task: () => Promise<{ error?: string; success?: boolean; createdCount?: number; processedCount?: number; updatedCount?: number; postId?: string; failures?: number }>, successMessage: string) => {
    startTransition(async () => {
      const result = await task();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(successMessage);
      const diagnosticResult = await getSocialAutomationDiagnosticsAction();
      if (diagnosticResult.success && diagnosticResult.diagnostics) {
        setCurrentDiagnostics(diagnosticResult.diagnostics);
      }
    });
  };

  const savePost = () => {
    if (!editingPost) {
      return;
    }

    startTransition(async () => {
      const result = await updateSocialPostAction({
        id: editingPost.id,
        scheduled_for: editingPost.scheduled_for ? new Date(editingPost.scheduled_for).toISOString() : null,
        platforms: editingPost.platforms,
        image_url: editingPost.image_url,
        product_name: editingPost.product_name,
        product_price: editingPost.product_price ? Number(editingPost.product_price) : null,
        product_description: editingPost.product_description || null,
        caption_en: editingPost.caption_en,
        caption_es: editingPost.caption_es,
        cta_en: editingPost.cta_en || null,
        cta_es: editingPost.cta_es || null,
        hashtags: splitListInput(editingPost.hashtags_text),
        combined_caption: editingPost.combined_caption,
        status: editingPost.scheduled_for ? "scheduled" : "draft"
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Social post updated");
      setEditingPost(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Queued posts</CardDescription>
            <CardTitle>{summary.queuedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published</CardDescription>
            <CardTitle>{summary.publishedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Failed</CardDescription>
            <CardTitle>{summary.failedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Automation</CardDescription>
            <CardTitle>{draftSettings.automation_enabled ? "Active" : "Paused"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Automation controls</CardTitle>
              <CardDescription>
                Queue posts in advance, publish due posts, or create a manual draft before sending it live.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => runAction(() => createManualSocialDraftAction(), "Manual draft created")}
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Manual draft
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => runAction(() => generateSocialQueueAction(), "Queue generated")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate queue
              </Button>
              <Button
                type="button"
                variant="gold"
                disabled={isPending}
                onClick={() => runAction(() => runSocialAutomationNowAction(), "Automation run completed")}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Run now
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => runAction(() => refreshSocialMetricsAction(), "Metrics refreshed")}
              >
                <WandSparkles className="mr-2 h-4 w-4" />
                Refresh metrics
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <IntegrationPill label="Supabase" enabled={integrations.supabase} />
            <IntegrationPill label="OpenAI" enabled={integrations.openai} />
            <IntegrationPill label="Meta token" enabled={integrations.metaAccessToken} />
            <IntegrationPill label="Facebook page" enabled={integrations.facebookPage} />
            <IntegrationPill label="Instagram business" enabled={integrations.instagramAccount} />
            <IntegrationPill label="Cron secret" enabled={integrations.cronSecret} />
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-secondary/50 p-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Due now
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {currentDiagnostics.dueCount}
              </p>
              {currentDiagnostics.overdueCount > 0 ? (
                <p className="mt-1 text-xs text-destructive">
                  {currentDiagnostics.overdueCount} overdue past 45 min
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Next scheduled
              </p>
              <p className="mt-2 text-sm text-foreground">
                {formatDateTime(currentDiagnostics.nextScheduledFor)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Last publishing error
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {currentDiagnostics.lastError ?? "No recent publishing errors"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Scheduling settings</CardTitle>
            <CardDescription>
              Configure daily slots, required post copy, CTA rotation, and hashtag defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={draftSettings.automation_enabled}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      automation_enabled: event.target.checked
                    }))
                  }
                />
                {draftSettings.automation_enabled ? (
                  <>
                    <PlayCircle className="h-4 w-4 text-bakery-gold" />
                    Automation enabled
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4 text-muted-foreground" />
                    Automation paused
                  </>
                )}
              </label>
              <label className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={draftSettings.hashtags_enabled}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      hashtags_enabled: event.target.checked
                    }))
                  }
                />
                Hashtag generation enabled
              </label>
              <div className="space-y-2">
                <Label htmlFor="social-timezone">Timezone</Label>
                <Input
                  id="social-timezone"
                  value={draftSettings.timezone}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      timezone: event.target.value
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="queue-days-ahead">Queue days ahead</Label>
                <Input
                  id="queue-days-ahead"
                  type="number"
                  min={0}
                  max={14}
                  value={draftSettings.queue_days_ahead}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      queue_days_ahead: Number(event.target.value || 0)
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily posting slots</h3>
                  <p className="text-sm text-muted-foreground">Default pattern is morning, afternoon, and night.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      schedule_entries: [
                        ...current.schedule_entries,
                        {
                          id: `slot-${current.schedule_entries.length + 1}`,
                          label: `Slot ${current.schedule_entries.length + 1}`,
                          time: "12:00",
                          enabled: true,
                          platforms: ["instagram", "facebook"]
                        }
                      ]
                    }))
                  }
                >
                  Add slot
                </Button>
              </div>
              <div className="space-y-3">
                {draftSettings.schedule_entries.map((entry, index) => (
                  <div key={`${entry.id}-${index}`} className="grid gap-3 rounded-[1.5rem] border border-border p-4 md:grid-cols-[1fr_140px_1fr_auto]">
                    <Input
                      value={entry.label}
                      onChange={(event) =>
                        setDraftSettings((current) => ({
                          ...current,
                          schedule_entries: current.schedule_entries.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label: event.target.value } : item
                          )
                        }))
                      }
                    />
                    <Input
                      type="time"
                      value={entry.time}
                      onChange={(event) =>
                        setDraftSettings((current) => ({
                          ...current,
                          schedule_entries: current.schedule_entries.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, time: event.target.value } : item
                          )
                        }))
                      }
                    />
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.enabled}
                          onChange={(event) =>
                            setDraftSettings((current) => ({
                              ...current,
                              schedule_entries: current.schedule_entries.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, enabled: event.target.checked } : item
                              )
                            }))
                          }
                        />
                        Enabled
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.platforms.includes("instagram")}
                          onChange={(event) =>
                            setDraftSettings((current) => ({
                              ...current,
                              schedule_entries: current.schedule_entries.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      platforms: event.target.checked
                                        ? addPlatform(item.platforms, "instagram")
                                        : removePlatform(item.platforms, "instagram")
                                    }
                                  : item
                              )
                            }))
                          }
                        />
                        Instagram
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.platforms.includes("facebook")}
                          onChange={(event) =>
                            setDraftSettings((current) => ({
                              ...current,
                              schedule_entries: current.schedule_entries.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      platforms: event.target.checked
                                        ? addPlatform(item.platforms, "facebook")
                                        : removePlatform(item.platforms, "facebook")
                                    }
                                  : item
                              )
                            }))
                          }
                        />
                        Facebook
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraftSettings((current) => ({
                          ...current,
                          schedule_entries: current.schedule_entries.filter((_, itemIndex) => itemIndex !== index)
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-3">
                <Label>Required lines in every English post</Label>
                {draftSettings.required_lines.map((line, index) => (
                  <div key={`required-${index}`} className="flex gap-2">
                    <Input
                      value={line}
                      onChange={(event) =>
                        setDraftSettings((current) => ({
                          ...current,
                          required_lines: current.required_lines.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          )
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraftSettings((current) => ({
                          ...current,
                          required_lines: current.required_lines.filter((_, itemIndex) => itemIndex !== index)
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      required_lines: [...current.required_lines, ""]
                    }))
                  }
                >
                  Add required line
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>CTA rotation in English</Label>
                  {draftSettings.cta_phrases_en.map((line, index) => (
                    <div key={`cta-en-${index}`} className="flex gap-2">
                      <Input
                        value={line}
                        onChange={(event) =>
                          setDraftSettings((current) => ({
                            ...current,
                            cta_phrases_en: current.cta_phrases_en.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item
                            )
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDraftSettings((current) => ({
                            ...current,
                            cta_phrases_en: current.cta_phrases_en.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDraftSettings((current) => ({
                        ...current,
                        cta_phrases_en: [...current.cta_phrases_en, ""]
                      }))
                    }
                  >
                    Add CTA
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>CTA rotation in Spanish</Label>
                  {draftSettings.cta_phrases_es.map((line, index) => (
                    <div key={`cta-es-${index}`} className="flex gap-2">
                      <Input
                        value={line}
                        onChange={(event) =>
                          setDraftSettings((current) => ({
                            ...current,
                            cta_phrases_es: current.cta_phrases_es.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item
                            )
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDraftSettings((current) => ({
                            ...current,
                            cta_phrases_es: current.cta_phrases_es.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDraftSettings((current) => ({
                        ...current,
                        cta_phrases_es: [...current.cta_phrases_es, ""]
                      }))
                    }
                  >
                    Add CTA
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-hashtags">Default hashtags</Label>
                <Textarea
                  id="default-hashtags"
                  rows={4}
                  value={draftSettings.default_hashtags.join(", ")}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      default_hashtags: splitListInput(event.target.value)
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Separate hashtags with commas or new lines.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone-notes">Tone notes</Label>
                <Textarea
                  id="tone-notes"
                  rows={4}
                  value={draftSettings.tone_notes ?? ""}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      tone_notes: event.target.value
                    }))
                  }
                />
              </div>
            </div>

            <Button type="button" variant="gold" disabled={isPending} onClick={saveSettings}>
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Queue and history</CardTitle>
            <CardDescription>
              Edit queued posts before they go live, publish manually, or inspect recent results.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <Tabs defaultValue="queue">
              <TabsList>
                <TabsTrigger value="queue">Queue</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="queue" className="min-w-0">
                {queueRows.length === 0 ? (
                  <EmptyState
                    title="No queued posts yet"
                    description="Generate the first batch and the system will store them in the database before publishing."
                    action={
                      <Button
                        type="button"
                        variant="gold"
                        onClick={() => runAction(() => generateSocialQueueAction(), "Queue generated")}
                      >
                        Generate queue
                      </Button>
                    }
                  />
                ) : (
                  <div className="w-full overflow-x-auto rounded-[1.5rem] border border-border/70">
                    <Table className="min-w-[900px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[155px]">When</TableHead>
                          <TableHead className="w-[190px]">Product</TableHead>
                          <TableHead className="w-[140px]">Platforms</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead className="w-[180px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queueRows.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="align-top">
                              <div className="flex items-start gap-2">
                                <Clock3 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                                <span>{formatDateTime(post.scheduled_for)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div>
                                <p className="font-medium">{post.product_name}</p>
                                <p className="text-xs text-muted-foreground">{post.schedule_entry_label ?? post.source_kind}</p>
                              </div>
                            </TableCell>
                            <TableCell className="align-top capitalize">{post.platforms.join(", ")}</TableCell>
                            <TableCell className="align-top">
                              <Badge variant={getStatusBadgeVariant(post.status)}>{post.status}</Badge>
                            </TableCell>
                            <TableCell className="align-top">
                              <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{post.caption_en}</p>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex justify-end gap-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setEditingPost(toEditablePost(post))}>
                                  <PencilLine className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    runAction(
                                      () => publishSocialPostNowAction(post.id),
                                      "Post published or sent to Meta"
                                    )
                                  }
                                >
                                  <Rocket className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => runAction(() => cancelSocialPostAction(post.id), "Post canceled")}
                                >
                                  <PauseCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => runAction(() => deleteSocialPostAction(post.id), "Post deleted")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="min-w-0">
                {historyRows.length === 0 ? (
                  <EmptyState
                    title="No publishing history yet"
                    description="Published, canceled, and failed posts will appear here once automation starts running."
                  />
                ) : (
                  <div className="w-full overflow-x-auto rounded-[1.5rem] border border-border/70">
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[170px]">Date</TableHead>
                          <TableHead className="w-[210px]">Product</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead>Platform results</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyRows.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="align-top">{formatDateTime(post.published_at ?? post.updated_at)}</TableCell>
                            <TableCell className="align-top">{post.product_name}</TableCell>
                            <TableCell className="align-top">
                              <Badge variant={getStatusBadgeVariant(post.status)}>{post.status}</Badge>
                            </TableCell>
                            <TableCell className="space-y-2 align-top">
                              {post.social_post_publications.length > 0 ? (
                                post.social_post_publications.map((publication) => (
                                  <div key={publication.id} className="rounded-2xl border border-border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-medium capitalize">{publication.platform}</p>
                                      <Badge variant={publication.status === "published" ? "gold" : "rose"}>
                                        {publication.status}
                                      </Badge>
                                    </div>
                                    {publication.remote_permalink ? (
                                      <a
                                        className="mt-2 block text-sm text-bakery-rose underline"
                                        href={publication.remote_permalink}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        View live post
                                      </a>
                                    ) : null}
                                    {summarizeMetrics(publication.metrics) ? (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        {summarizeMetrics(publication.metrics)}
                                      </p>
                                    ) : null}
                                    {publication.error_message ? (
                                      <p className="mt-2 text-xs text-rose-600">{publication.error_message}</p>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No publication records yet.</p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => (!open ? setEditingPost(null) : null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit queued post</DialogTitle>
            <DialogDescription>
              Review bilingual copy, schedule timing, platforms, and the final caption before publishing.
            </DialogDescription>
          </DialogHeader>
          {editingPost ? (
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product name</Label>
                  <Input
                    value={editingPost.product_name}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, product_name: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPost.product_price}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, product_price: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheduled for</Label>
                  <Input
                    type="datetime-local"
                    value={editingPost.scheduled_for}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, scheduled_for: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={editingPost.image_url}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, image_url: event.target.value } : current))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product description</Label>
                <Textarea
                  rows={3}
                  value={editingPost.product_description}
                  onChange={(event) =>
                    setEditingPost((current) => (current ? { ...current, product_description: event.target.value } : current))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-4 rounded-2xl border border-border px-4 py-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPost.platforms.includes("instagram")}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current
                          ? {
                              ...current,
                              platforms: event.target.checked
                                ? addPlatform(current.platforms, "instagram")
                                : removePlatform(current.platforms, "instagram")
                            }
                          : current
                      )
                    }
                  />
                  Instagram
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPost.platforms.includes("facebook")}
                    onChange={(event) =>
                      setEditingPost((current) =>
                        current
                          ? {
                              ...current,
                              platforms: event.target.checked
                                ? addPlatform(current.platforms, "facebook")
                                : removePlatform(current.platforms, "facebook")
                            }
                          : current
                      )
                    }
                  />
                  Facebook
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Caption EN</Label>
                  <Textarea
                    rows={9}
                    value={editingPost.caption_en}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, caption_en: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Caption ES</Label>
                  <Textarea
                    rows={9}
                    value={editingPost.caption_es}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, caption_es: event.target.value } : current))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CTA EN</Label>
                  <Input
                    value={editingPost.cta_en}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, cta_en: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA ES</Label>
                  <Input
                    value={editingPost.cta_es}
                    onChange={(event) =>
                      setEditingPost((current) => (current ? { ...current, cta_es: event.target.value } : current))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hashtags</Label>
                <Textarea
                  rows={3}
                  value={editingPost.hashtags_text}
                  onChange={(event) =>
                    setEditingPost((current) => (current ? { ...current, hashtags_text: event.target.value } : current))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Combined caption</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setEditingPost((current) =>
                        current ? { ...current, combined_caption: buildCombinedCaptionPreview(current) } : current
                      )
                    }
                  >
                    Rebuild preview
                  </Button>
                </div>
                <Textarea
                  rows={10}
                  value={editingPost.combined_caption}
                  onChange={(event) =>
                    setEditingPost((current) => (current ? { ...current, combined_caption: event.target.value } : current))
                  }
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingPost(null)}>
              Close
            </Button>
            <Button type="button" variant="gold" disabled={isPending} onClick={savePost}>
              Save post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
