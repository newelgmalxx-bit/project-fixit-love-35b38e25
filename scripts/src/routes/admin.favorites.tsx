import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout, PanelCard } from "@/components/admin/AdminLayout";
import { admin } from "@/lib/api";
import { useLang } from "@/i18n/LanguageProvider";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";

export const Route = createFileRoute("/admin/favorites")({
  head: () => ({ meta: [{ title: "المفضّلات | الإدارة" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { lang } = useLang();
  const L = (a: string, e: string) => (lang === "en" ? e : a);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await admin.getFavorites({ page: 1, limit: 100 });
        setItems(r?.data?.items ?? []);
        setTotal(r?.data?.total ?? 0);
      } catch (e: any) {
        toast.error(e?.message || "Failed");
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <AdminLayout
      title={L("المفضّلات", "Favorites")}
      subtitle={L(`إجمالي العناصر المضافة للمفضّلة من العملاء (${total})`, `Total user favorites (${total})`)}
    >
      <PanelCard title={L("القائمة", "List")}>
        {loading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{L("لا توجد مفضّلات", "No favorites")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-start py-2 px-3">{L("العرض", "Offer")}</th>
                  <th className="text-start py-2 px-3">{L("المستخدم", "User")}</th>
                  <th className="text-start py-2 px-3">{L("التاريخ", "Date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-bold flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> {it.offerTitle || it.offerId}</td>
                    <td className="py-2 px-3 text-xs font-mono" dir="ltr">{it.userId}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground" dir="ltr">{it.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </AdminLayout>
  );
}
