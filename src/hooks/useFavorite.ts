import { useEffect, useState } from "react";
import { favorites as favApi } from "@/lib/api/services";
import { getToken } from "@/lib/api/client";
import { toast } from "sonner";

const FAV_KEY = "saba_service_favorites_v1";
const EVENT = "saba:favorites";

// In-memory cache of favorited offerIds → true
let cache: Record<string, boolean> = {};
let loaded = false;
let loading: Promise<void> | null = null;

function persistCache() {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(cache)); } catch {}
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cache = parsed;
    }
  } catch {}
}

export async function loadFavorites(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (!getToken()) {
    // Not authenticated → no server favorites
    cache = {};
    loaded = true;
    persistCache();
    emit();
    return;
  }
  if (loaded && !force) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const r: any = await favApi.list();
      const items: any[] = r?.data?.items ?? [];
      const ids: string[] = r?.data?.ids ?? items.map((it) => String(it.offerId ?? it.offer_id ?? it.id));
      const next: Record<string, boolean> = {};
      ids.forEach((id) => { if (id) next[String(id)] = true; });
      cache = next;
      loaded = true;
      persistCache();
      emit();
    } catch {
      // keep cache as-is; mark loaded so we don't spin
      loaded = true;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export function readFavs(): Record<string, boolean> {
  if (!loaded) hydrateFromStorage();
  return { ...cache };
}

export function useFavorite(id: string) {
  const [fav, setFav] = useState<boolean>(() => !!cache[id]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setFav(!!cache[id]);
    sync();
    if (!loaded) {
      hydrateFromStorage();
      sync();
      loadFavorites();
    }
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  async function toggle() {
    if (!id || busy) return;
    if (!getToken()) {
      toast.error("سجل دخول لإضافة العرض للمفضلة");
      return;
    }
    setBusy(true);
    const was = !!cache[id];
    // optimistic
    if (was) delete cache[id]; else cache[id] = true;
    persistCache();
    emit();
    try {
      if (was) await favApi.remove(id);
      else await favApi.add(id);
    } catch (e: any) {
      // revert
      if (was) cache[id] = true; else delete cache[id];
      persistCache();
      emit();
      toast.error(e?.message || "تعذر تحديث المفضلة");
    } finally {
      setBusy(false);
    }
  }

  return { fav, toggle, busy };
}
