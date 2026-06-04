// Demo messaging store (localStorage). Will be replaced by real API later.
// Shared between user account, partner dashboard, and admin.

export type DemoMsg = {
  id: string;
  from: "user" | "partner";
  text: string;
  time: string; // HH:mm
};

export type DemoConversation = {
  id: string;
  userName: string;
  userPhone: string;
  partnerName: string;
  partnerCity: string;
  lastTime: string; // "قبل 5 د"
  unreadUser: number;
  unreadPartner: number;
  online: boolean;
  closed: boolean;
  closedBy?: "admin";
  closedReason?: string;
  messages: DemoMsg[];
};

const KEY = "demo_conversations_v1";

const SEED: DemoConversation[] = [
  {
    id: "c1",
    userName: "نورة م.",
    userPhone: "0551234567",
    partnerName: "مركز روز للجمال",
    partnerCity: "الرياض",
    lastTime: "قبل 5 د",
    unreadUser: 0,
    unreadPartner: 2,
    online: true,
    closed: false,
    messages: [
      { id: "m1", from: "user", text: "السلام عليكم، عندي حجز السبت 4 العصر", time: "10:12" },
      { id: "m2", from: "partner", text: "وعليكم السلام، أهلاً بكِ نورة، الموعد مؤكد ✨", time: "10:15" },
      { id: "m3", from: "user", text: "ممكن أأجل الموعد لبكرة نفس الوقت؟", time: "10:18" },
    ],
  },
  {
    id: "c2",
    userName: "سارة ع.",
    userPhone: "0567894561",
    partnerName: "مركز لمسة أنوثة",
    partnerCity: "جدة",
    lastTime: "قبل ساعة",
    unreadUser: 0,
    unreadPartner: 0,
    online: false,
    closed: false,
    messages: [
      { id: "m1", from: "user", text: "شكراً على الخدمة كانت ممتازة", time: "09:00" },
      { id: "m2", from: "partner", text: "تمام، نورتينا 🌹", time: "09:05" },
    ],
  },
  {
    id: "c3",
    userName: "ريم ف.",
    userPhone: "0501112223",
    partnerName: "صالون لافندر",
    partnerCity: "الدمام",
    lastTime: "أمس",
    unreadUser: 1,
    unreadPartner: 0,
    online: true,
    closed: false,
    messages: [
      { id: "m1", from: "user", text: "متاحين السبت الجاي؟", time: "14:20" },
      { id: "m2", from: "partner", text: "نعم متاحين، تفضلي احجزي عبر الموقع", time: "15:00" },
    ],
  },
  {
    id: "c4",
    userName: "هند ك.",
    userPhone: "0533344455",
    partnerName: "مركز روز للجمال",
    partnerCity: "الرياض",
    lastTime: "قبل يومين",
    unreadUser: 0,
    unreadPartner: 1,
    online: false,
    closed: true,
    closedBy: "admin",
    closedReason: "تم حل الخلاف وتسوية المبلغ",
    messages: [
      { id: "m1", from: "user", text: "السعر شامل الضريبة؟", time: "11:00" },
      { id: "m2", from: "partner", text: "نعم شامل الضريبة", time: "11:30" },
    ],
  },
];

function read(): DemoConversation[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as DemoConversation[];
  } catch {
    return SEED;
  }
}

function write(list: DemoConversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("demo_conversations_changed"));
}

export const demoMessages = {
  list: () => read(),
  listForUser: (userName: string) => read().filter((c) => c.userName === userName),
  listForPartner: (_partnerId?: string) => read(),
  get: (id: string) => read().find((c) => c.id === id),
  send: (id: string, from: "user" | "partner", text: string) => {
    const list = read();
    const c = list.find((x) => x.id === id);
    if (!c || c.closed) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    c.messages.push({ id: `m${Date.now()}`, from, text, time });
    c.lastTime = "الآن";
    if (from === "user") c.unreadPartner += 1;
    else c.unreadUser += 1;
    write(list);
  },
  markRead: (id: string, who: "user" | "partner" | "admin") => {
    const list = read();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    if (who === "user") c.unreadUser = 0;
    if (who === "partner") c.unreadPartner = 0;
    write(list);
  },
  close: (id: string, reason: string) => {
    const list = read();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    c.closed = true;
    c.closedBy = "admin";
    c.closedReason = reason || "أُغلقت بواسطة الإدارة";
    write(list);
  },
  reopen: (id: string) => {
    const list = read();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    c.closed = false;
    c.closedBy = undefined;
    c.closedReason = undefined;
    write(list);
  },
  subscribe: (cb: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("demo_conversations_changed", cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener("demo_conversations_changed", cb);
      window.removeEventListener("storage", cb);
    };
  },
};
