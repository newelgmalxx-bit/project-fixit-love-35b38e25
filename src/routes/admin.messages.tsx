import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { AdminLayout, PanelCard } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "الرسائل | Admin" }] }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  return (
    <AdminLayout title="الرسائل" subtitle="عرض ومتابعة محادثات العملاء مع المراكز">
      <PanelCard>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 opacity-40" />
          <p className="text-sm font-bold">لا توجد محادثات بعد</p>
          <p className="max-w-md text-xs">
            ستظهر هنا محادثات العملاء مع المراكز عند تفعيل خدمة المراسلة في الخلفية.
          </p>
        </div>
      </PanelCard>
    </AdminLayout>
  );
}
