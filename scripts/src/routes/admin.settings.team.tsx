import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout, PanelCard, Pill } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { Check, Users2 } from "lucide-react";
import { adminUsers as fallbackUsers } from "@/data/admin";
import { useLang } from "@/i18n/LanguageProvider";
import { admin as adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/settings/team")({
  head: () => ({ meta: [{ title: "Team & Roles | Settings" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { lang, dir } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const roles = [
    { key: "owner", label: L("مالك", "Owner"), desc: L("صلاحيات كاملة بما فيها الفوترة وحذف الحساب", "Full access including billing and account deletion"), tone: "amber" as const },
    { key: "admin", label: L("مدير", "Admin"), desc: L("إدارة كل المحتوى والإعدادات والمستخدمين", "Manage all content, settings and users"), tone: "primary" as const },
    { key: "manager", label: L("مشرف", "Manager"), desc: L("إدارة الطلبات والعملاء والخدمات بدون إعدادات حسّاسة", "Manage orders, clients, services — no sensitive settings"), tone: "violet" as const },
    { key: "support", label: L("دعم", "Support"), desc: L("عرض الطلبات والرد على العملاء فقط", "View orders and reply to clients only"), tone: "emerald" as const },
  ];
  const matrix = [
    { feature: L("لوحة التحكم", "Dashboard"), owner: true, admin: true, manager: true, support: true },
    { feature: L("إدارة الخدمات", "Manage Services"), owner: true, admin: true, manager: true, support: false },
    { feature: L("إدارة الطلبات", "Manage Orders"), owner: true, admin: true, manager: true, support: true },
    { feature: L("إدارة الفواتير", "Manage Invoices"), owner: true, admin: true, manager: true, support: false },
    { feature: L("إدارة العملاء", "Manage Clients"), owner: true, admin: true, manager: true, support: true },
    { feature: L("إدارة المستخدمين", "Manage Users"), owner: true, admin: true, manager: false, support: false },
    { feature: L("إعدادات الموقع/SEO", "Site / SEO Settings"), owner: true, admin: true, manager: false, support: false },
    { feature: L("إعدادات الدفع/API", "Payment / API Settings"), owner: true, admin: false, manager: false, support: false },
  ];

  const [tab, setTab] = useState<"members" | "roles">("members");
  const [members, setMembers] = useState(fallbackUsers);
  useEffect(() => {
    adminApi.users.list()
      .then((p: any) => {
        const items = (p?.items || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.email || "—",
          email: u.email || "",
          role: (u.role || "support") as any,
          active: u.status ? u.status === "active" : true,
        }));
        if (items.length) setMembers(items);
      })
      .catch(() => {});
  }, []);
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  return (
    <AdminLayout title={L("الإعدادات", "Settings")} subtitle={L("الفريق والصلاحيات", "Team & Permissions")} action={<Link to="/admin/users" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold">{L("إدارة المستخدمين", "Manage Users")}</Link>}>
      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
        {[["members", L("الأعضاء", "Members")], ["roles", L("الأدوار والصلاحيات", "Roles & Permissions")]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}>{l}</button>
        ))}
      </div>

      {tab === "members" && (
        <PanelCard title={L("أعضاء الفريق", "Team Members")} subtitle={`${members.length} ${L("مستخدم", "users")}`} action={<Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">{L("إدارة كاملة ←", "Full management →")}</Link>}>
          <div className="space-y-2">
            {members.map(u => {
              const initials = u.name.split(" ").map(n => n[0]).slice(0, 2).join("");
              const role = roles.find(r => r.key === u.role) ?? roles[roles.length - 1];
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">{initials}</div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Pill tone={role.tone}>{role.label}</Pill>
                    <Pill tone={u.active ? "emerald" : "muted"}>{u.active ? L("نشط", "Active") : L("موقوف", "Suspended")}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        </PanelCard>
      )}

      {tab === "roles" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {roles.map(r => (
              <div key={r.key} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users2 className="h-4 w-4" /></div>
                  <Pill tone={r.tone}>{r.label}</Pill>
                </div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            ))}
          </div>
          <PanelCard title={L("مصفوفة الصلاحيات", "Permissions Matrix")}>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${textAlign} text-xs text-muted-foreground border-b border-border`}>
                    <th className="px-3 py-3 font-medium">{L("الميزة", "Feature")}</th>
                    {roles.map(r => <th key={r.key} className="px-3 py-3 font-medium text-center">{r.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map(m => (
                    <tr key={m.feature} className="border-b border-border">
                      <td className="px-3 py-3 font-medium">{m.feature}</td>
                      {(["owner","admin","manager","support"] as const).map(k => (
                        <td key={k} className="px-3 py-3 text-center">
                          {m[k] ? <Check className="inline h-4 w-4 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </>
      )}
    </AdminLayout>
  );
}
