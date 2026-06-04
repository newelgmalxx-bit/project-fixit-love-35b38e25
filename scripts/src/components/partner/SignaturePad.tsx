import { useEffect, useRef, useState } from "react";
import { Eraser, PenTool } from "lucide-react";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
};

/** Hand-drawn signature pad. Outputs PNG dataURL via onChange. */
export function SignaturePad({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(!value);

  // Resize canvas to its CSS size (for crisp drawing on HiDPI)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
    // restore existing value if any
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
      setEmpty(false);
    }
  }, []);

  function pos(e: PointerEvent | React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e as PointerEvent).clientX - rect.left, y: (e as PointerEvent).clientY - rect.top };
  }

  function start(e: React.PointerEvent) {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const data = canvasRef.current!.toDataURL("image/png");
    setEmpty(false);
    onChange(data);
  }
  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
    onChange("");
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <PenTool className="h-3.5 w-3.5 text-primary" /> وقّع بإصبعك أو بالماوس داخل المربع
        </div>
        <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700">
          <Eraser className="h-3 w-3" /> مسح
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          style={{ touchAction: "none" }}
          className="block w-full h-44 cursor-crosshair bg-white"
        />
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            اسحب هنا لتوقيع العقد
          </div>
        )}
      </div>
    </div>
  );
}
