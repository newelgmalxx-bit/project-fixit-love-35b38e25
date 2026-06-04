// Converts any uploaded image File to a WebP data URL using canvas.
// Falls back to original data URL if WebP encoding fails (e.g. SVG).
export async function fileToWebp(file: File, quality = 0.85, maxDim = 1920): Promise<string> {
  if (typeof window === "undefined") return "";
  if (file.type === "image/svg+xml") return readAsDataURL(file);
  const dataUrl = await readAsDataURL(file);
  try {
    const img = await loadImage(dataUrl);
    let { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    const webp = canvas.toDataURL("image/webp", quality);
    if (webp && webp.startsWith("data:image/webp")) return webp;
    return dataUrl;
  } catch {
    return dataUrl;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Uploads the image to the backend (multipart/form-data) and returns the public URL.
// Never returns base64 — image fields in API requests must always be URL strings.
export async function uploadImage(file: File, bucket = "avatars"): Promise<string> {
  if (typeof window === "undefined") return "";
  const { BASE, getToken, getSid } = await import("./api/client");

  // Try to convert to webp Blob first (smaller upload). Fall back to original file.
  let uploadBlob: Blob = file;
  let filename = file.name || "upload";
  try {
    if (file.type !== "image/svg+xml") {
      const webpDataUrl = await fileToWebp(file);
      if (webpDataUrl.startsWith("data:image/webp")) {
        const res = await fetch(webpDataUrl);
        uploadBlob = await res.blob();
        filename = (filename.replace(/\.[^.]+$/, "") || "upload") + ".webp";
      }
    }
  } catch { /* fall back to original file */ }

  const fd = new FormData();
  fd.append("file", uploadBlob, filename);
  fd.append("bucket", bucket);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers["X-Session-Id"] = getSid();

  const res = await fetch(`${BASE}/upload`, { method: "POST", headers, body: fd });
  let json: any = null;
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.message || `Upload failed (${res.status})`);
  }
  const url = json?.data?.url ?? json?.url ?? json?.data?.path ?? "";
  if (!url || typeof url !== "string") throw new Error("Upload response missing url");
  return url;
}