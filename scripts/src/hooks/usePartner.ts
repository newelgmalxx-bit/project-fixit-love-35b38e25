import { useState, useEffect, useCallback } from "react";
import { getStoredPartner, partnerAuth, type PartnerProfile } from "@/lib/api/partner";

export function usePartner() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);

  const sync = useCallback(() => {
    setPartner(getStoredPartner());
  }, []);

  useEffect(() => {
    sync();
    const onPartner = () => sync();
    const onStorage = () => sync();
    window.addEventListener("saba:partner", onPartner);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("saba:partner", onPartner);
      window.removeEventListener("storage", onStorage);
    };
  }, [sync]);

  const partnerLogout = useCallback(async () => {
    await partnerAuth.logout();
    sync();
    window.dispatchEvent(new Event("saba:auth"));
  }, [sync]);

  return {
    partner,
    isPartner: !!partner,
    partnerLogout,
  };
}
