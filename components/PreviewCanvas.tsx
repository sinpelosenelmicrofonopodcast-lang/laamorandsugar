"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { LocateFixed, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import type { TreatDesignerProduct, TreatDesignerSprinkleSet } from "@/lib/types/app";
import type { UploadedLogo } from "@/components/LogoUploader";
import { Button } from "@/components/ui/button";

export type PreviewCanvasHandle = {
  exportImage: () => string | null;
};

type LogoTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type LoadedImage = {
  src: string;
  image: HTMLImageElement;
};

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 760;
const DEFAULT_LOGO_TRANSFORM: LogoTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
};

export const PreviewCanvas = forwardRef<
  PreviewCanvasHandle,
  {
    product: TreatDesignerProduct | null;
    baseImage: string | null;
    color: string | null;
    sprinkleSet: TreatDesignerSprinkleSet | null;
    logo: UploadedLogo | null;
    onLogoChange?: (logo: UploadedLogo | null) => void;
  }
>(function PreviewCanvas({ product, color, sprinkleSet, logo, onLogoChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; logoX: number; logoY: number } | null>(null);
  const [logoImage, setLogoImage] = useState<LoadedImage | null>(null);
  const [sprinkleImage, setSprinkleImage] = useState<LoadedImage | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [pointerTilt, setPointerTilt] = useState({ x: 0, y: 0 });
  const logoTransform = useMemo<LogoTransform>(
    () => ({
      ...DEFAULT_LOGO_TRANSFORM,
      ...(logo?.transform ?? {})
    }),
    [logo?.transform]
  );
  const treatKind = getTreatKind(product?.name ?? product?.slug ?? "");
  const treatColor = color ?? getDefaultTreatColor(treatKind);

  useImperativeHandle(ref, () => ({
    exportImage: () => canvasRef.current?.toDataURL("image/png", 0.94) ?? null
  }));

  useEffect(() => {
    if (!logo?.url) {
      setLogoImage(null);
      return;
    }

    loadImage(logo.url).then(setLogoImage).catch(() => setLogoImage(null));
  }, [logo?.url]);

  useEffect(() => {
    if (!sprinkleSet?.image_url) {
      setSprinkleImage(null);
      return;
    }

    loadImage(sprinkleSet.image_url).then(setSprinkleImage).catch(() => setSprinkleImage(null));
  }, [sprinkleSet?.image_url]);

  const updateLogoTransform = useCallback(
    (nextTransform: Partial<LogoTransform>) => {
      if (!logo || !onLogoChange) {
        return;
      }

      onLogoChange({
        ...logo,
        transform: {
          ...logoTransform,
          ...nextTransform
        }
      });
    },
    [logo, logoTransform, onLogoChange]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    drawPreview(context, {
      productName: product?.name ?? "Luxury Treat",
      treatKind,
      treatColor,
      sprinkleColor: sprinkleSet?.color_hex ?? "#c59b45",
      sprinkleImage: sprinkleImage?.image ?? null,
      logoImage: logoImage?.image ?? null,
      logoTransform,
      tilt: pointerTilt
    });
  }, [
    logoImage,
    logoTransform,
    pointerTilt,
    product?.name,
    sprinkleImage,
    sprinkleSet?.color_hex,
    treatColor,
    treatKind
  ]);

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    };
  }

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,244,247,0.7),rgba(197,155,69,0.12))] p-3 shadow-[0_30px_90px_rgba(95,74,65,0.18)] backdrop-blur-xl sm:p-4"
      style={{
        transform: isHovering
          ? `perspective(1100px) rotateX(${pointerTilt.y * -3}deg) rotateY(${pointerTilt.x * 3}deg)`
          : undefined,
        transition: "transform 220ms ease-out",
        transformStyle: "preserve-3d"
      }}
      onPointerMove={(event) => {
        const rect = containerRef.current?.getBoundingClientRect();

        if (!rect) {
          return;
        }

        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        setPointerTilt({ x: clamp(x, -1, 1), y: clamp(y, -1, 1) });
      }}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => {
        setIsHovering(false);
        setPointerTilt({ x: 0, y: 0 });
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.75),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(197,155,69,0.22),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)] opacity-0 blur-sm transition duration-700 group-hover:translate-x-[220%] group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-4 px-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
              Live luxury preview
            </p>
            <h2 className="font-serif text-3xl leading-tight text-foreground">
              Edible print mockup
            </h2>
          </div>
          <span className="rounded-full bg-white/78 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-bakery-rose shadow-sm">
            Real-time
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="aspect-[720/760] w-full cursor-grab touch-none rounded-[2rem] bg-[#fffaf6] shadow-inner active:cursor-grabbing"
          aria-label="Interactive live preview of your custom treat design"
          onPointerDown={(event) => {
            if (!logo?.url) {
              return;
            }

            const point = canvasPoint(event);
            dragRef.current = {
              pointerId: event.pointerId,
              startX: point.x,
              startY: point.y,
              logoX: logoTransform.x,
              logoY: logoTransform.y
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;

            if (!drag || drag.pointerId !== event.pointerId) {
              return;
            }

            const point = canvasPoint(event);
            updateLogoTransform({
              x: clamp(drag.logoX + (point.x - drag.startX) / 140, -1, 1),
              y: clamp(drag.logoY + (point.y - drag.startY) / 150, -1, 1)
            });
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) {
              dragRef.current = null;
            }
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        />
        {logo?.url ? (
          <div className="mt-4 rounded-[1.7rem] border border-white/75 bg-white/78 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Logo placement</p>
                <p className="text-xs text-muted-foreground">
                  Drag directly on the treat. Fine tune scale and rotation below.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => updateLogoTransform(DEFAULT_LOGO_TRANSFORM)}
              >
                <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
                Center
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ControlButton
                label="Smaller"
                icon={ZoomOut}
                onClick={() => updateLogoTransform({ scale: clamp(logoTransform.scale - 0.12, 0.45, 2.2) })}
              />
              <ControlButton
                label="Larger"
                icon={ZoomIn}
                onClick={() => updateLogoTransform({ scale: clamp(logoTransform.scale + 0.12, 0.45, 2.2) })}
              />
              <ControlButton
                label="Rotate"
                icon={RotateCcw}
                onClick={() => updateLogoTransform({ rotation: (logoTransform.rotation + 12) % 360 })}
              />
            </div>
            <div className="mt-3 grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-bakery-gold">
                Scale
                <input
                  type="range"
                  min="0.45"
                  max="2.2"
                  step="0.01"
                  value={logoTransform.scale}
                  onChange={(event) => updateLogoTransform({ scale: Number(event.target.value) })}
                  className="mt-2 block w-full accent-bakery-rose"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-bakery-gold">
                Rotation
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={normalizeRotation(logoTransform.rotation)}
                  onChange={(event) => updateLogoTransform({ rotation: Number(event.target.value) })}
                  className="mt-2 block w-full accent-bakery-rose"
                />
              </label>
            </div>
          </div>
        ) : (
          <p className="mt-3 px-2 text-xs leading-5 text-muted-foreground">
            Upload artwork to see it clipped, blended, and printed into the dessert surface.
          </p>
        )}
      </div>
    </div>
  );
});

function ControlButton({
  label,
  icon: Icon,
  onClick
}: {
  label: string;
  icon: typeof ZoomIn;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-bakery-gold/20 bg-white/86 px-3 text-sm font-semibold text-bakery-espresso transition hover:-translate-y-0.5 hover:border-bakery-gold/40"
    >
      <Icon className="h-4 w-4 text-bakery-gold" />
      {label}
    </button>
  );
}

function drawPreview(
  context: CanvasRenderingContext2D,
  input: {
    productName: string;
    treatKind: TreatKind;
    treatColor: string;
    sprinkleColor: string;
    sprinkleImage: HTMLImageElement | null;
    logoImage: HTMLImageElement | null;
    logoTransform: LogoTransform;
    tilt: { x: number; y: number };
  }
) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawStudioBackdrop(context, input.tilt);
  drawGiftStage(context);

  context.save();
  context.translate(CANVAS_WIDTH / 2 + input.tilt.x * 10, CANVAS_HEIGHT / 2 + input.tilt.y * 6);
  context.rotate((input.tilt.x * Math.PI) / 110);
  context.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

  drawTreatShadow(context, input.treatKind);
  drawTreatBase(context, input.treatKind, input.treatColor);
  drawChocolateDepth(context, input.treatKind);

  if (input.logoImage) {
    drawPrintedLogo(context, input.treatKind, input.logoImage, input.logoTransform);
  }

  drawDrizzle(context, input.treatKind, input.sprinkleColor);
  drawSprinkleLayer(context, input.treatKind, input.sprinkleColor, input.sprinkleImage);
  drawGlossAndTexture(context, input.treatKind);
  drawEdgeLight(context, input.treatKind);
  context.restore();

  drawProductLabel(context, input.productName);
}

function drawStudioBackdrop(context: CanvasRenderingContext2D, tilt: { x: number; y: number }) {
  const gradient = context.createRadialGradient(
    CANVAS_WIDTH * 0.5 + tilt.x * 24,
    170 + tilt.y * 16,
    40,
    CANVAS_WIDTH * 0.5,
    330,
    520
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.44, "#fff2f5");
  gradient.addColorStop(1, "#f5ded7");
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = "rgba(197,155,69,0.14)";
  context.beginPath();
  context.arc(614, 112, 94, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.42)";
  context.beginPath();
  context.arc(108, 628, 130, 0, Math.PI * 2);
  context.fill();
}

function drawGiftStage(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(150, 610, 570, 710);
  gradient.addColorStop(0, "rgba(255,255,255,0.82)");
  gradient.addColorStop(1, "rgba(197,155,69,0.16)");
  context.fillStyle = gradient;
  roundRect(context, 120, 574, 480, 92, 46);
  context.fill();

  context.fillStyle = "rgba(95,74,65,0.13)";
  context.beginPath();
  context.ellipse(360, 578, 190, 34, 0, 0, Math.PI * 2);
  context.fill();
}

function drawTreatShadow(context: CanvasRenderingContext2D, kind: TreatKind) {
  const box = getTreatBox(kind);
  context.save();
  context.filter = "blur(18px)";
  context.fillStyle = "rgba(83,55,49,0.24)";
  context.beginPath();
  context.ellipse(box.cx, box.shadowY, box.shadowRx, box.shadowRy, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawTreatBase(context: CanvasRenderingContext2D, kind: TreatKind, color: string) {
  const gradient = context.createRadialGradient(292, 210, 40, 372, 305, 265);
  gradient.addColorStop(0, lighten(color, 0.58));
  gradient.addColorStop(0.38, color);
  gradient.addColorStop(1, darken(color, 0.18));

  context.save();
  context.shadowColor = "rgba(96,62,54,0.26)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 28;
  context.fillStyle = gradient;
  buildTreatPath(context, kind, "outer");
  context.fill();
  context.restore();

  if (kind === "cakepop") {
    drawStick(context, 350, 455, 22, 158);
  }

  if (kind === "cakesicle") {
    drawStick(context, 350, 494, 28, 150);
  }

  if (kind === "box") {
    drawBoxCompartments(context);
  }
}

function drawStick(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const stickGradient = context.createLinearGradient(x - width, y, x + width, y + height);
  stickGradient.addColorStop(0, "#d7b99f");
  stickGradient.addColorStop(0.5, "#f2d7bf");
  stickGradient.addColorStop(1, "#b88d72");
  context.save();
  context.shadowColor = "rgba(95,74,65,0.14)";
  context.shadowBlur = 12;
  context.shadowOffsetX = 8;
  context.shadowOffsetY = 10;
  context.fillStyle = stickGradient;
  roundRect(context, x - width / 2, y, width, height, width / 2);
  context.fill();
  context.restore();
}

function drawChocolateDepth(context: CanvasRenderingContext2D, kind: TreatKind) {
  context.save();
  buildTreatPath(context, kind, "outer");
  context.clip();

  const inner = context.createLinearGradient(230, 136, 510, 520);
  inner.addColorStop(0, "rgba(255,255,255,0.38)");
  inner.addColorStop(0.36, "rgba(255,255,255,0.05)");
  inner.addColorStop(0.72, "rgba(82,48,45,0.08)");
  inner.addColorStop(1, "rgba(69,39,36,0.22)");
  context.fillStyle = inner;
  context.fillRect(120, 60, 480, 520);

  context.globalAlpha = 0.13;
  for (let index = 0; index < 90; index += 1) {
    const x = 150 + seeded(index * 11) * 420;
    const y = 95 + seeded(index * 17) * 420;
    context.fillStyle = index % 2 === 0 ? "#fffaf6" : "#6f4740";
    context.beginPath();
    context.arc(x, y, 0.8 + seeded(index) * 1.7, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawPrintedLogo(
  context: CanvasRenderingContext2D,
  kind: TreatKind,
  image: HTMLImageElement,
  transform: LogoTransform
) {
  const print = getPrintArea(kind);
  const width = print.width * transform.scale;
  const height = width * (image.height / image.width);
  const x = print.cx + transform.x * print.width * 0.34;
  const y = print.cy + transform.y * print.height * 0.36;

  context.save();
  buildTreatPath(context, kind, "print");
  context.clip();
  context.translate(x, y);
  context.rotate((transform.rotation * Math.PI) / 180 + print.rotation);
  context.transform(1, print.perspectiveY, print.perspectiveX, 1, 0, 0);

  context.globalAlpha = 0.72;
  context.filter = "saturate(0.86) contrast(0.9) brightness(1.08)";
  context.globalCompositeOperation = "multiply";
  context.drawImage(image, -width / 2, -height / 2, width, height);

  context.globalCompositeOperation = "screen";
  context.globalAlpha = 0.16;
  context.filter = "blur(0.4px)";
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();

  context.save();
  buildTreatPath(context, kind, "print");
  context.clip();
  const seal = context.createRadialGradient(print.cx - 35, print.cy - 45, 15, print.cx, print.cy, print.width * 0.62);
  seal.addColorStop(0, "rgba(255,255,255,0.23)");
  seal.addColorStop(0.52, "rgba(255,255,255,0.08)");
  seal.addColorStop(1, "rgba(89,52,45,0.13)");
  context.fillStyle = seal;
  buildTreatPath(context, kind, "print");
  context.fill();
  context.restore();
}

function drawDrizzle(context: CanvasRenderingContext2D, kind: TreatKind, color: string) {
  context.save();
  buildTreatPath(context, kind, "outer");
  context.clip();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = lighten(color, 0.46);
  context.shadowColor = "rgba(255,255,255,0.28)";
  context.shadowBlur = 7;
  context.lineWidth = kind === "box" ? 8 : 11;

  const paths =
    kind === "cakesicle"
      ? [
          "M230 220 C282 188 418 190 488 228",
          "M214 278 C288 324 418 326 504 278",
          "M226 350 C300 386 420 388 492 342"
        ]
      : kind === "box"
        ? [
            "M182 220 C290 176 426 180 536 230",
            "M176 342 C300 392 434 390 542 334"
          ]
        : [
            "M212 214 C286 170 428 178 500 232",
            "M194 304 C292 360 424 356 518 296",
            "M230 398 C318 442 426 430 488 378"
          ];

  paths.forEach((path) => {
    context.stroke(new Path2D(path));
  });
  context.restore();
}

function drawSprinkleLayer(
  context: CanvasRenderingContext2D,
  kind: TreatKind,
  color: string,
  sprinkleImage: HTMLImageElement | null
) {
  context.save();
  buildTreatPath(context, kind, "outer");
  context.clip();

  if (sprinkleImage) {
    context.globalAlpha = 0.42;
    context.globalCompositeOperation = "multiply";
    const box = getTreatBox(kind);
    context.drawImage(sprinkleImage, box.cx - 145, box.cy - 130, 290, 260);
    context.restore();
    return;
  }

  const sprinklePoints = getSprinklePoints(kind);
  sprinklePoints.forEach(([x, y, angle, size], index) => {
    context.save();
    context.translate(x, y);
    context.rotate((angle * Math.PI) / 180);
    context.fillStyle = index % 3 === 0 ? "#fffaf6" : index % 3 === 1 ? color : darken(color, 0.12);
    context.shadowColor = "rgba(95,74,65,0.13)";
    context.shadowBlur = 4;
    roundRect(context, -size / 2, -3, size, 6, 3);
    context.fill();
    context.restore();
  });
  context.restore();
}

function drawGlossAndTexture(context: CanvasRenderingContext2D, kind: TreatKind) {
  context.save();
  buildTreatPath(context, kind, "outer");
  context.clip();
  const gloss = context.createRadialGradient(265, 175, 22, 310, 220, 230);
  gloss.addColorStop(0, "rgba(255,255,255,0.42)");
  gloss.addColorStop(0.35, "rgba(255,255,255,0.12)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gloss;
  context.fillRect(130, 70, 470, 500);

  context.strokeStyle = "rgba(255,255,255,0.34)";
  context.lineWidth = 11;
  context.lineCap = "round";
  context.stroke(new Path2D("M246 146 C304 104 404 112 462 156"));

  context.globalCompositeOperation = "multiply";
  context.strokeStyle = "rgba(90,50,44,0.07)";
  context.lineWidth = 18;
  context.stroke(new Path2D("M172 442 C274 520 456 514 554 426"));
  context.restore();
}

function drawEdgeLight(context: CanvasRenderingContext2D, kind: TreatKind) {
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.42)";
  context.lineWidth = 4;
  buildTreatPath(context, kind, "outer");
  context.stroke();
  context.strokeStyle = "rgba(197,155,69,0.18)";
  context.lineWidth = 7;
  buildTreatPath(context, kind, "outer");
  context.stroke();
  context.restore();
}

function drawProductLabel(context: CanvasRenderingContext2D, productName: string) {
  context.fillStyle = "rgba(255,255,255,0.82)";
  roundRect(context, 198, 670, 324, 48, 24);
  context.fill();
  context.fillStyle = "#6b4d48";
  context.font = "600 22px Georgia, serif";
  context.textAlign = "center";
  context.fillText(productName.slice(0, 32), CANVAS_WIDTH / 2, 701);
}

type TreatKind = "cakepop" | "cakesicle" | "strawberry" | "oreo" | "box";

function getTreatKind(value: string): TreatKind {
  const text = value.toLowerCase();

  if (text.includes("cakesicle")) return "cakesicle";
  if (text.includes("strawberry") || text.includes("berries")) return "strawberry";
  if (text.includes("oreo")) return "oreo";
  if (text.includes("box") || text.includes("bucket")) return "box";
  return "cakepop";
}

function getDefaultTreatColor(kind: TreatKind) {
  if (kind === "oreo") return "#51322f";
  if (kind === "strawberry") return "#f5f0e8";
  if (kind === "box") return "#f7b8c7";
  return "#f4a9ba";
}

function getTreatBox(kind: TreatKind) {
  if (kind === "cakesicle") return { cx: 360, cy: 305, shadowY: 602, shadowRx: 140, shadowRy: 26 };
  if (kind === "box") return { cx: 360, cy: 326, shadowY: 604, shadowRx: 190, shadowRy: 32 };
  return { cx: 360, cy: 316, shadowY: 588, shadowRx: 150, shadowRy: 28 };
}

function getPrintArea(kind: TreatKind) {
  if (kind === "cakesicle") {
    return { cx: 360, cy: 292, width: 186, height: 230, rotation: 0, perspectiveX: -0.04, perspectiveY: 0.02 };
  }

  if (kind === "box") {
    return { cx: 360, cy: 312, width: 244, height: 190, rotation: 0, perspectiveX: -0.02, perspectiveY: 0.01 };
  }

  if (kind === "strawberry") {
    return { cx: 360, cy: 320, width: 178, height: 170, rotation: -0.02, perspectiveX: -0.03, perspectiveY: 0.02 };
  }

  return { cx: 360, cy: 306, width: 184, height: 184, rotation: 0, perspectiveX: -0.025, perspectiveY: 0.018 };
}

function buildTreatPath(context: CanvasRenderingContext2D, kind: TreatKind, mode: "outer" | "print") {
  const print = mode === "print";

  context.beginPath();

  if (kind === "cakesicle") {
    roundRect(context, print ? 244 : 218, print ? 150 : 102, print ? 232 : 284, print ? 296 : 404, print ? 108 : 142);
    return;
  }

  if (kind === "box") {
    roundRect(context, print ? 222 : 164, print ? 194 : 126, print ? 276 : 392, print ? 240 : 382, print ? 54 : 80);
    return;
  }

  if (kind === "strawberry") {
    const scale = print ? 0.72 : 1;
    const cx = 360;
    const top = print ? 206 : 130;
    const width = 260 * scale;
    const height = 340 * scale;
    context.moveTo(cx, top + height);
    context.bezierCurveTo(cx - width, top + height * 0.55, cx - width * 0.62, top, cx, top + height * 0.16);
    context.bezierCurveTo(cx + width * 0.62, top, cx + width, top + height * 0.55, cx, top + height);
    context.closePath();
    return;
  }

  context.arc(360, 304, print ? 112 : 168, 0, Math.PI * 2);
}

function drawBoxCompartments(context: CanvasRenderingContext2D) {
  context.save();
  buildTreatPath(context, "box", "outer");
  context.clip();
  context.strokeStyle = "rgba(255,255,255,0.42)";
  context.lineWidth = 8;
  context.stroke(new Path2D("M238 276 H482"));
  context.stroke(new Path2D("M360 154 V494"));
  context.restore();
}

function getSprinklePoints(kind: TreatKind) {
  const base =
    kind === "cakesicle"
      ? [
          [304, 210, 18, 26],
          [420, 232, -24, 22],
          [288, 326, -18, 24],
          [430, 386, 30, 20],
          [360, 276, 48, 18]
        ]
      : [
          [274, 210, 20, 26],
          [438, 218, -24, 24],
          [250, 332, -18, 22],
          [472, 344, 32, 24],
          [342, 438, -30, 20],
          [386, 184, 55, 18]
        ];

  return base as [number, number, number, number][];
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function loadImage(src: string) {
  return new Promise<LoadedImage>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve({ src, image });
    image.onerror = reject;
    image.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seeded(index: number) {
  const x = Math.sin(index * 999) * 10000;
  return x - Math.floor(x);
}

function normalizeRotation(rotation: number) {
  if (rotation > 180) {
    return rotation - 360;
  }

  return rotation;
}

function lighten(hex: string, amount: number) {
  return mix(hex, "#ffffff", amount);
}

function darken(hex: string, amount: number) {
  return mix(hex, "#3f2928", amount);
}

function mix(hex: string, target: string, amount: number) {
  const base = parseHex(hex);
  const next = parseHex(target);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * amount);

  return `rgb(${channel(base.r, next.r)}, ${channel(base.g, next.g)}, ${channel(base.b, next.b)})`;
}

function parseHex(value: string) {
  const clean = value.trim().replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const parsed = Number.parseInt(normalized || "f4a9ba", 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}
