import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PanelCard, PrimaryButton, GhostButton, Pill } from "@/components/admin/AdminLayout";
import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, Copy, RefreshCw, PlugZap, Search, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { partnerAdminApi, getPartnerKey, setPartnerKey } from "@/lib/partnerAdminApi";
import type { PartnerOrder } from "@/types/partner";

export const Route = createFileRoute("/admin/partner")({
  head: () => ({ meta: [{ title: "Partner API | Admin" }] }),
  component: PartnerApiPage,
});

const STATUSES = [
  { value: "all", ar: "الكل", en: "All" },
  { value: "new", ar: "جديد", en: "New" },
  { value: "in_progress", ar: "قيد التنفيذ", en: "In progress" },
  { value: "completed", ar: "مكتمل", en: "Completed" },
  { value: "cancelled", ar: "ملغي", en: "Cancelled" },
];

const statusTone = (s: string): "primary" | "emerald" | "amber" | "rose" | "muted" => {
  if (s === "completed") return "emerald";
  if (s === "in_progress") return "amber";
  if (s === "cancelled") return "rose";
  if (s === "new") return "primary";
  return "muted";
};

function PartnerApiPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);

  // ---------- Card 1: Basic API Settings ----------
  const [apiKey, setApiKeyState] = useState("");
  const [showKey, setShowKey] = useState(false);
  useEffect(() => { setApiKeyState(getPartnerKey()); }, []);

  const saveKey = () => {
    setPartnerKey(apiKey.trim());
    toast.success(L("تم حفظ المفتاح", "Key saved"));
  };
  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success(L("تم النسخ", "Copied")); };

  // ---------- Card 2: Connection & Sync ----------
  const [pingState, setPingState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [pingMsg, setPingMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  const testConnection = async () => {
    setPingState("loading"); setPingMsg("");
    try {
      const r = await partnerAdminApi.ping();
      setPingState("ok");
      setPingMsg(r?.message || L("الاتصال ناجح", "Connection successful"));
      toast.success(L("الاتصال ناجح", "Connection successful"));
    } catch (e: any) {
      setPingState("fail");
      setPingMsg(e?.message || L("فشل الاتصال", "Connection failed"));
      toast.error(e?.message || L("فشل الاتصال", "Connection failed"));
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await partnerAdminApi.sync();
      toast.success(r?.message || L(`تمت المزامنة (${r?.synced ?? 0})`, `Synced (${r?.synced ?? 0})`));
      loadOrders();
    } catch (e: any) {
      toast.error(e?.message || L("فشلت المزامنة", "Sync failed"));
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Card 3: Orders ----------
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PartnerOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    if (!getPartnerKey()) return;
    setLoadingOrders(true);
    try {
      const res: any = await partnerAdminApi.listOrders({ status: statusFilter, q });
      const list: PartnerOrder[] = Array.isArray(res) ? res : (res?.data ?? []);
      setOrders(list);
    } catch (e: any) {
      toast.error(e?.message || L("تعذر جلب الطلبات", "Failed to load orders"));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => { loadOrders(); /* eslint-disable-next-line */ }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!q) return orders;
    const t = q.toLowerCase();
    return orders.filter(o =>
      String(o.id).includes(t) ||
      (o.reference || "").toLowerCase().includes(t) ||
      (o.customer_name || "").toLowerCase().includes(t) ||
      (o.customer_email || "").toLowerCase().includes(t),
    );
  }, [orders, q]);

  const openOrder = async (o: PartnerOrder) => {
    setSelected(o);
    setDrawerOpen(true);
    try {
      const r: any = await partnerAdminApi.getOrder(o.id);
      const full: PartnerOrder = r?.data ?? r;
      if (full) setSelected(full);
    } catch { /* keep summary */ }
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await partnerAdminApi.updateOrderStatus(selected.id, status);
      setSelected({ ...selected, status });
      setOrders(prev => prev.map(p => p.id === selected.id ? { ...p, status } : p));
      toast.success(L("تم تحديث الحالة", "Status updated"));
    } catch (e: any) {
      toast.error(e?.message || L("فشل التحديث", "Update failed"));
    } finally {
      setUpdating(false);
    }
  };

  // ---------- Card 4: Webhooks (UI only) ----------
  const [webhookUrl, setWebhookUrl] = useState("https://koswmat.com/api/webhooks/partner");
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  const fmtMoney = (n: number, c?: string | null) => `${Number(n || 0).toLocaleString()} ${c || L("ر.س", "SAR")}`;

  return (
    <AdminLayout
      title={L("إدارة API الشريك", "Partner API Management")}
      subtitle={L("اختبار وإدارة اتصال API مع موقع الشريك", "Test and manage Partner API integration")}
    >
      {/* Card 1 */}
      <PanelCard
        title={L("إعدادات API الأساسية", "Basic API Settings")}
        subtitle={L("رابط الـ API ومفتاح الاتصال", "API endpoint and authentication key")}
        className="mb-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{L("رابط الـ API", "Base API URL")}</Label>
            <div className="flex gap-2">
              <Input dir="ltr" readOnly value={partnerAdminApi.baseUrl} className="font-mono text-xs" />
              <GhostButton onClick={() => copy(partnerAdminApi.baseUrl)}><Copy className="h-4 w-4" /></GhostButton>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{L("مفتاح API الشريك", "Partner API Key")}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  dir="ltr"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="sk_live_..."
                  className="font-mono text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? L("إخفاء", "Hide") : L("إظهار", "Show")}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PrimaryButton onClick={saveKey}>{L("حفظ", "Save")}</PrimaryButton>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {L("يُحفظ المفتاح محلياً في المتصفح لاستخدامه في الاختبار.", "Stored locally in your browser for testing.")}
            </p>
          </div>
        </div>
      </PanelCard>

      {/* Card 2 */}
      <PanelCard
        title={L("الاتصال والمزامنة", "Connection & Sync")}
        subtitle={L("اختبار الاتصال وسحب أحدث الطلبات من الشريك", "Test connection and pull latest orders")}
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={testConnection}>
            {pingState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
            {L("اختبار الاتصال", "Test Connection")}
          </PrimaryButton>
          <GhostButton onClick={syncNow}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {L("مزامنة الآن", "Sync Now")}
          </GhostButton>
          {pingState !== "idle" && pingState !== "loading" && (
            <div className={`flex items-center gap-1.5 text-sm font-bold ${pingState === "ok" ? "text-emerald-600" : "text-rose-600"}`}>
              {pingState === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{pingMsg}</span>
            </div>
          )}
        </div>
      </PanelCard>

      {/* Card 3 */}
      <PanelCard
        title={L("طلبات الشريك الواردة", "Incoming Partner Orders")}
        subtitle={L("عرض وإدارة الطلبات القادمة من API الشريك", "View and manage orders pulled from the Partner API")}
        action={
          <GhostButton onClick={loadOrders}>
            {loadingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {L("تحديث", "Refresh")}
          </GhostButton>
        }
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L("بحث برقم الطلب أو العميل...", "Search by order or customer...")}
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{L(s.ar, s.en)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L("المرجع", "Reference")}</TableHead>
                <TableHead>{L("العميل", "Customer")}</TableHead>
                <TableHead>{L("الإجمالي", "Total")}</TableHead>
                <TableHead>{L("الحالة", "Status")}</TableHead>
                <TableHead>{L("التاريخ", "Date")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingOrders ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  {getPartnerKey() ? L("لا توجد طلبات", "No orders") : L("أدخل مفتاح API أولاً", "Enter API key first")}
                </TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={String(o.id)} className="cursor-pointer" onClick={() => openOrder(o)}>
                  <TableCell className="font-mono text-xs">{o.reference || `#${o.id}`}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{o.customer_name || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{o.customer_email || ""}</div>
                  </TableCell>
                  <TableCell className="font-bold">{fmtMoney(o.total, o.currency)}</TableCell>
                  <TableCell><Pill tone={statusTone(o.status)}>{o.status}</Pill></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell><ExternalLink className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      {/* Card 4 */}
      <PanelCard
        title={L("Webhooks", "Webhooks")}
        subtitle={L("استقبال الأحداث من الشريك تلقائياً", "Receive partner events automatically")}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{L("رابط Webhook لاستقبال الأحداث", "Webhook URL")}</Label>
            <Input
              dir="ltr"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://koswmat.com/api/webhooks/partner"
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-bold">{L("تفعيل استقبال الأحداث", "Enable Events")}</div>
              <div className="text-[11px] text-muted-foreground">
                {L("سيتم إرسال أحداث الطلبات الجديدة تلقائياً عند تفعيل Webhook.", "New order events will be sent automatically when enabled.")}
              </div>
            </div>
            <Switch checked={webhookEnabled} onCheckedChange={setWebhookEnabled} />
          </div>
        </div>
      </PanelCard>

      {/* Order Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {L("تفاصيل الطلب", "Order details")} {selected ? `· ${selected.reference || `#${selected.id}`}` : ""}
            </DrawerTitle>
            <DrawerDescription>
              {selected?.created_at ? new Date(selected.created_at).toLocaleString() : ""}
            </DrawerDescription>
          </DrawerHeader>

          {selected && (
            <div className="px-4 pb-4 overflow-y-auto space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <Info label={L("العميل", "Customer")} value={selected.customer_name || "—"} />
                <Info label={L("البريد", "Email")} value={selected.customer_email || "—"} />
                <Info label={L("الجوال", "Phone")} value={selected.customer_phone || "—"} />
                <Info label={L("الإجمالي", "Total")} value={fmtMoney(selected.total, selected.currency)} />
              </div>

              <div>
                <div className="text-xs font-bold mb-2 text-muted-foreground">{L("العناصر", "Items")}</div>
                <div className="rounded-xl border border-border divide-y">
                  {(selected.items || []).map((it, i) => (
                    <div key={i} className="flex items-center justify-between p-3 text-sm">
                      <div>
                        <div className="font-medium">{it.title}</div>
                        {it.plan && <div className="text-[11px] text-muted-foreground">{it.plan}</div>}
                      </div>
                      <div className="text-left">
                        <div>{fmtMoney(it.price, selected.currency)}</div>
                        <div className="text-[11px] text-muted-foreground">× {it.qty}</div>
                      </div>
                    </div>
                  ))}
                  {(!selected.items || selected.items.length === 0) && (
                    <div className="p-3 text-xs text-muted-foreground text-center">{L("لا عناصر", "No items")}</div>
                  )}
                </div>
              </div>

              {selected.notes && (
                <div>
                  <div className="text-xs font-bold mb-2 text-muted-foreground">{L("ملاحظات", "Notes")}</div>
                  <Textarea readOnly value={selected.notes} />
                </div>
              )}

              <div>
                <Label className="mb-1.5 block">{L("تحديث الحالة", "Update status")}</Label>
                <div className="flex items-center gap-2">
                  <Select value={selected.status} onValueChange={changeStatus} disabled={updating}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.filter(s => s.value !== "all").map(s => (
                        <SelectItem key={s.value} value={s.value}>{L(s.ar, s.en)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Pill tone={statusTone(selected.status)}>{selected.status}</Pill>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <DrawerClose asChild><GhostButton>{L("إغلاق", "Close")}</GhostButton></DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}