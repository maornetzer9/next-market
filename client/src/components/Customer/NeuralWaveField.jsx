import React, { useEffect, useId, useMemo } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

/**
 * Silk-ribbon Neural Wave — Framer Motion path morph.
 * Paths live in a 100×750 rail space (X = % of sidebar width).
 * Only the expanded composition is drawn; collapsed simply hides/pauses it.
 */

const SILK = [
  {
    id: "a",
    layer: "a",
    tier: "primary",
    w: 1.15,
    o: 0.68,
    tone: "ember",
    glow: true,
    duration: 8.6,
    frames: [
      "M-6.8 18 C 2.7 78, 6.8 150, 2.7 230 C -2.7 330, 6.8 420, 25.8 510 C 44.9 595, 73.4 650, 102 705",
      "M-6.8 18 C 9.5 82, 13.6 145, 9.5 225 C 4.1 325, 16.3 415, 34 505 C 50.3 590, 76.2 648, 102 705",
      "M-6.8 18 C -1.4 74, 1.4 155, -2.7 235 C -9.5 335, 1.4 425, 20.4 515 C 40.8 600, 72.1 652, 102 705",
      "M-6.8 18 C 6.8 88, 10.9 148, 5.4 240 C 0 320, 12.2 430, 31.3 500 C 53 585, 77.5 650, 102 705",
      "M-6.8 18 C 2.7 78, 6.8 150, 2.7 230 C -2.7 330, 6.8 420, 25.8 510 C 44.9 595, 73.4 650, 102 705",
    ],
  },
  {
    id: "b",
    layer: "b",
    tier: "primary",
    w: 1.0,
    o: 0.54,
    tone: "coral",
    glow: true,
    duration: 11.2,
    frames: [
      "M1.4 8 C 12.2 70, 15 140, 9.5 220 C 2.7 320, 12.2 410, 32.6 500 C 53 585, 81.6 640, 108.8 692",
      "M1.4 8 C 6.8 68, 8.2 145, 4.1 225 C -2.7 325, 6.8 415, 27.2 505 C 49 590, 80.2 642, 108.8 692",
      "M1.4 8 C 17.7 76, 20.4 135, 15 215 C 9.5 315, 20.4 405, 38.1 495 C 57.1 580, 83 638, 108.8 692",
      "M1.4 8 C 10.9 64, 12.2 148, 6.8 228 C 1.4 318, 10.9 420, 35.4 492 C 54.4 578, 84.3 645, 108.8 692",
      "M1.4 8 C 12.2 70, 15 140, 9.5 220 C 2.7 320, 12.2 410, 32.6 500 C 53 585, 81.6 640, 108.8 692",
    ],
  },
  {
    id: "c",
    layer: "c",
    tier: "secondary",
    w: 0.82,
    o: 0.38,
    tone: "deep",
    glow: false,
    duration: 13.4,
    frames: [
      "M-15 48 C -4.1 110, 0 185, -5.4 270 C -12.2 365, 0 455, 19 545 C 38.1 620, 68 665, 96.6 710",
      "M-15 48 C 2.7 115, 6.8 180, 1.4 265 C -4.1 360, 8.2 450, 25.8 540 C 43.5 615, 70.7 662, 96.6 710",
      "M-15 48 C -8.2 105, -5.4 190, -9.5 275 C -16.3 370, -5.4 460, 13.6 550 C 34 625, 66.6 668, 96.6 710",
      "M-15 48 C 0 120, 4.1 175, -1.4 280 C -8.2 355, 4.1 465, 23.1 535 C 40.8 610, 69.4 670, 96.6 710",
      "M-15 48 C -4.1 110, 0 185, -5.4 270 C -12.2 365, 0 455, 19 545 C 38.1 620, 68 665, 96.6 710",
    ],
  },
  {
    id: "d",
    layer: "d",
    tier: "depth",
    w: 0.62,
    o: 0.22,
    tone: "muted",
    glow: false,
    duration: 9.8,
    frames: [
      "M9.5 55 C 20.4 115, 19 190, 12.2 275 C 4.1 370, 15 460, 36.7 545 C 57.1 620, 85.7 660, 114.2 700",
      "M9.5 55 C 15 110, 12.2 195, 6.8 280 C -1.4 375, 9.5 465, 31.3 550 C 53 625, 84.3 662, 114.2 700",
      "M9.5 55 C 25.8 120, 24.5 185, 17.7 270 C 10.9 365, 23.1 455, 42.2 540 C 61.2 615, 87 658, 114.2 700",
      "M9.5 55 C 19 108, 16.3 200, 10.9 268 C 5.4 360, 17.7 470, 39.4 538 C 58.5 612, 88.4 665, 114.2 700",
      "M9.5 55 C 20.4 115, 19 190, 12.2 275 C 4.1 370, 15 460, 36.7 545 C 57.1 620, 85.7 660, 114.2 700",
    ],
  },
  {
    id: "e",
    layer: "b",
    tier: "background",
    w: 0.52,
    o: 0.14,
    tone: "ember",
    glow: false,
    duration: 14.8,
    frames: [
      "M-2.7 95 C 8.2 155, 5.4 235, 0 320 C -6.8 415, 5.4 505, 27.2 585 C 47.6 650, 76.2 685, 103.4 722",
      "M-2.7 95 C 13.6 160, 10.9 230, 5.4 315 C 0 410, 12.2 500, 32.6 580 C 51.7 645, 77.5 682, 103.4 722",
      "M-2.7 95 C 2.7 150, 0 240, -5.4 325 C -12.2 420, 0 510, 21.8 590 C 43.5 655, 74.8 688, 103.4 722",
      "M-2.7 95 C 10.9 165, 8.2 228, 2.7 330 C -4.1 405, 9.5 515, 29.9 575 C 49 640, 78.9 690, 103.4 722",
      "M-2.7 95 C 8.2 155, 5.4 235, 0 320 C -6.8 415, 5.4 505, 27.2 585 C 47.6 650, 76.2 685, 103.4 722",
    ],
  },
  {
    id: "f",
    layer: "c",
    tier: "background",
    w: 0.48,
    o: 0.12,
    tone: "coral",
    glow: false,
    duration: 12.1,
    frames: [
      "M15 120 C 25.8 180, 23.1 260, 16.3 345 C 8.2 440, 20.4 525, 42.2 600 C 62.6 655, 88.4 688, 115.6 725",
      "M15 120 C 20.4 175, 17.7 265, 10.9 350 C 2.7 445, 15 530, 36.7 605 C 58.5 660, 87 690, 115.6 725",
      "M15 120 C 31.3 185, 28.6 255, 21.8 340 C 15 435, 27.2 520, 47.6 595 C 66.6 650, 89.8 685, 115.6 725",
      "M15 120 C 24.5 170, 21.8 270, 15 338 C 9.5 430, 23.1 535, 44.9 592 C 63.9 648, 91.1 692, 115.6 725",
      "M15 120 C 25.8 180, 23.1 260, 16.3 345 C 8.2 440, 20.4 525, 42.2 600 C 62.6 655, 88.4 688, 115.6 725",
    ],
  },
];

const TONE_STOPS = {
  deep: ["#b92f32", "#d64332"],
  coral: ["#d64332", "#ff6a45"],
  ember: ["#ff6a45", "#ff8a5c"],
  muted: ["#c94a3a", "#d64332"],
};

const MORPH_TIMES = [0, 0.28, 0.52, 0.78, 1];
const MORPH_EASE = ["easeInOut", "easeInOut", "easeInOut", "easeInOut"];

const MOBILE_FIBERS = [
  {
    d: "M-30 30 C 80 8, 180 40, 280 18 C 380 0, 480 36, 580 14 C 680 -4, 780 32, 900 16 C 960 8, 1000 28, 1040 20",
    w: 0.9,
    o: 0.55,
  },
  {
    d: "M-40 22 C 70 42, 170 6, 270 28 C 370 48, 470 10, 570 30 C 670 48, 770 12, 890 26 C 950 34, 1000 14, 1050 24",
    w: 0.55,
    o: 0.28,
  },
  {
    d: "M-20 36 C 90 14, 190 44, 290 22 C 390 4, 490 40, 600 18 C 700 0, 800 34, 920 20",
    w: 0.45,
    o: 0.22,
  },
];

function SilkPath({ strand, rawId, glowId, filamentGlowId, animate }) {
  const stroke = `url(#nm-tone-${strand.tone}-${rawId})`;
  const frames = useMemo(
    () =>
      Array.isArray(strand.frames)
        ? strand.frames.filter((frame) => typeof frame === "string" && /^m/i.test(frame.trim()))
        : [],
    [strand.frames]
  );
  const rest = frames[0];
  const coreControls = useAnimationControls();
  const filamentControls = useAnimationControls();

  useEffect(() => {
    if (!rest) return undefined;

    if (!animate) {
      coreControls.set({ d: rest });
      if (strand.glow) filamentControls.set({ d: rest });
      coreControls.stop();
      filamentControls.stop();
      return undefined;
    }

    const loop = {
      d: frames,
      transition: {
        duration: strand.duration,
        repeat: Infinity,
        ease: MORPH_EASE,
        times: MORPH_TIMES,
      },
    };

    coreControls.start(loop);
    if (strand.glow) filamentControls.start(loop);

    return () => {
      coreControls.stop();
      filamentControls.stop();
    };
  }, [animate, coreControls, filamentControls, frames, rest, strand.duration, strand.glow]);

  if (!rest) return null;

  return (
    <g
      className={`nm-wave__strand nm-wave__strand--${strand.id} nm-wave__strand--${strand.tier}`}
      style={{ "--strand-o": strand.o }}
    >
      <motion.path
        className={
          strand.glow
            ? "nm-wave__path nm-wave__path--core"
            : "nm-wave__path nm-wave__path--whisper"
        }
        d={rest}
        initial={{ d: rest }}
        fill="none"
        stroke={stroke}
        strokeWidth={strand.w}
        strokeLinecap="round"
        vectorEffect="nonScalingStroke"
        filter={glowId ? `url(#${glowId})` : undefined}
        animate={coreControls}
      />
      {strand.glow ? (
        <motion.path
          className="nm-wave__path nm-wave__path--filament"
          d={rest}
          initial={{ d: rest }}
          fill="none"
          stroke={stroke}
          strokeWidth={Math.max(strand.w * 0.42, 0.32)}
          strokeLinecap="round"
          vectorEffect="nonScalingStroke"
          filter={`url(#${filamentGlowId})`}
          animate={filamentControls}
        />
      ) : null}
    </g>
  );
}

export default function NeuralWaveField({ orientation = "vertical", collapsed = false }) {
  const rawId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const isVertical = orientation === "vertical";

  if (!isVertical) {
    const strokeId = `nm-wave-h-stroke-${rawId}`;
    return (
      <svg
        className="nm-wave nm-wave--horizontal"
        viewBox="0 0 920 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={strokeId} x1="0" y1="24" x2="920" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d64332" stopOpacity="0" />
            <stop offset="30%" stopColor="#ff6a45" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#d64332" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d64332" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="nm-wave__layer nm-wave__layer--a">
          {MOBILE_FIBERS.filter((fiber) => typeof fiber.d === "string" && /^m/i.test(fiber.d)).map(
            (fiber, index) => (
            <path
              key={`h-${index}`}
              className="nm-wave__path"
              d={fiber.d}
              fill="none"
              stroke={`url(#${strokeId})`}
              strokeWidth={fiber.w}
              strokeLinecap="round"
              opacity={fiber.o}
            />
            )
          )}
        </g>
      </svg>
    );
  }

  const softGlowId = `nm-wave-soft-${rawId}`;
  const strongGlowId = `nm-wave-strong-${rawId}`;
  const filamentGlowId = `nm-wave-filament-${rawId}`;
  const maskId = `nm-rail-mask-${rawId}`;
  const animate = !reduceMotion && !collapsed;

  return (
    <svg
      className={`nm-wave nm-wave--vertical nm-wave--expanded${collapsed ? " is-collapsed-hidden" : ""}`}
      viewBox="0 0 100 750"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {Object.entries(TONE_STOPS).map(([tone, [a, b]]) => (
          <linearGradient
            key={tone}
            id={`nm-tone-${tone}-${rawId}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="42"
            y2="750"
          >
            <stop offset="0%" stopColor={a} stopOpacity="0" />
            <stop offset="10%" stopColor={a} stopOpacity="0.78" />
            <stop offset="48%" stopColor={b} stopOpacity="0.95" />
            <stop offset="86%" stopColor={a} stopOpacity="0.48" />
            <stop offset="100%" stopColor={b} stopOpacity="0" />
          </linearGradient>
        ))}

        <filter id={filamentGlowId} x="-20%" y="-6%" width="140%" height="112%">
          <feGaussianBlur stdDeviation="0.22" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={softGlowId} x="-16%" y="-6%" width="132%" height="112%">
          <feGaussianBlur stdDeviation="0.24" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={strongGlowId} x="-22%" y="-8%" width="144%" height="116%">
          <feGaussianBlur stdDeviation="0.32" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id={`nm-rail-read-${rawId}`} x1="0" y1="0" x2="0" y2="750" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="12%" stopColor="white" stopOpacity="0.96" />
          <stop offset="50%" stopColor="white" stopOpacity="1" />
          <stop offset="88%" stopColor="white" stopOpacity="0.86" />
          <stop offset="100%" stopColor="white" stopOpacity="0.58" />
        </linearGradient>

        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="750" fill={`url(#nm-rail-read-${rawId})`} />
        </mask>
      </defs>

      <g className="nm-wave__field" mask={`url(#${maskId})`}>
        {(["d", "c", "b", "a"]).map((layer) => (
          <g key={layer} className={`nm-wave__layer nm-wave__layer--${layer}`}>
            {SILK.filter((strand) => strand.layer === layer).map((strand) => (
              <SilkPath
                key={strand.id}
                strand={strand}
                rawId={rawId}
                glowId={
                  strand.glow
                    ? strongGlowId
                    : strand.tier === "secondary"
                      ? softGlowId
                      : undefined
                }
                filamentGlowId={filamentGlowId}
                animate={animate}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
