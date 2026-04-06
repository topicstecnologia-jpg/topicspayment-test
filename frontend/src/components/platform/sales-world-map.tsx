"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Globe2, Grip, MapPinned, MoveRight, Radar, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PlatformDashboardMapData } from "@/types/platform";

const STAGE_WIDTH = 1880;
const STAGE_HEIGHT = 860;

const continentShapes = [
  {
    id: "north-america",
    d: "M118 190C155 145 235 126 307 136C351 142 402 165 431 193C452 214 451 241 429 260C403 281 367 281 337 291C306 302 282 323 253 341C221 360 173 359 142 333C113 308 101 269 102 235C104 217 109 202 118 190Z"
  },
  {
    id: "greenland",
    d: "M432 102C456 88 494 86 523 98C542 107 550 126 544 144C536 163 515 176 489 179C461 182 435 173 424 155C412 137 414 116 432 102Z"
  },
  {
    id: "central-america",
    d: "M343 334C366 334 389 342 402 356C414 369 412 387 399 401C386 416 372 428 364 445C356 463 347 477 331 478C317 478 308 467 307 452C306 434 317 420 324 407C332 393 332 382 327 369C322 354 329 336 343 334Z"
  },
  {
    id: "south-america",
    d: "M372 440C406 431 446 442 469 470C487 493 489 529 478 564C468 594 451 617 445 651C439 688 427 724 401 740C382 752 356 748 341 729C326 710 325 681 320 652C313 615 293 581 295 545C297 499 326 451 372 440Z"
  },
  {
    id: "europe",
    d: "M786 196C815 177 859 172 897 182C924 189 944 205 945 224C946 242 929 253 905 256C881 260 855 255 834 263C813 271 796 287 773 287C751 286 733 269 730 247C727 225 748 206 786 196Z"
  },
  {
    id: "africa",
    d: "M844 294C879 281 924 286 958 310C986 329 1002 361 1003 398C1004 431 995 465 977 495C958 526 954 554 943 589C932 626 913 657 883 669C858 679 827 671 806 651C786 632 783 603 783 572C782 541 772 517 761 491C749 463 744 430 747 398C751 352 786 316 844 294Z"
  },
  {
    id: "middle-east",
    d: "M964 288C993 274 1030 276 1059 288C1087 300 1105 322 1106 347C1106 373 1091 390 1064 402C1036 415 1008 421 988 441C968 460 946 472 920 468C895 463 880 443 882 419C884 395 903 379 921 364C941 347 946 328 946 309C947 300 953 293 964 288Z"
  },
  {
    id: "asia",
    d: "M1032 170C1082 150 1153 145 1224 153C1294 161 1369 184 1431 218C1477 244 1515 281 1525 323C1520 351 1494 368 1458 373C1422 379 1382 372 1346 382C1305 394 1271 416 1244 445C1217 474 1196 509 1162 521C1125 535 1077 530 1038 513C997 495 968 463 953 423C938 384 938 343 936 306C934 261 968 196 1032 170Z"
  },
  {
    id: "south-east-asia",
    d: "M1227 452C1258 441 1297 447 1324 467C1343 481 1347 501 1339 518C1331 536 1313 545 1296 554C1280 562 1272 578 1258 589C1241 601 1215 600 1199 589C1185 579 1183 560 1192 543C1201 525 1216 514 1224 496C1231 482 1212 467 1227 452Z"
  },
  {
    id: "japan",
    d: "M1452 270C1466 264 1483 269 1491 282C1498 294 1498 311 1490 324C1482 337 1468 345 1456 341C1444 336 1440 321 1441 305C1442 291 1441 277 1452 270Z"
  },
  {
    id: "australia",
    d: "M1389 560C1431 540 1487 540 1531 559C1567 574 1588 602 1589 632C1588 660 1569 685 1538 701C1504 719 1458 724 1418 716C1380 708 1350 688 1343 660C1337 633 1348 604 1367 584C1374 576 1381 567 1389 560Z"
  },
  {
    id: "madagascar",
    d: "M1010 590C1024 583 1040 588 1048 602C1056 616 1057 638 1051 657C1045 676 1032 688 1019 686C1008 684 1000 671 998 655C996 639 998 620 1003 606C1005 598 1007 593 1010 590Z"
  }
] as const;

const latitudeLines = [148, 214, 284, 356, 430, 506, 584, 662] as const;
const longitudeLines = [152, 312, 474, 636, 798, 960, 1124, 1288, 1450, 1614, 1776] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildRoutePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const x1 = (from.x / 100) * STAGE_WIDTH;
  const y1 = (from.y / 100) * STAGE_HEIGHT;
  const x2 = (to.x / 100) * STAGE_WIDTH;
  const y2 = (to.y / 100) * STAGE_HEIGHT;
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.16 - 90;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function SalesWorldMap({
  map,
  activeTab,
  onTabChange
}: {
  map: PlatformDashboardMapData;
  activeTab: "Visao Geral" | "Fluxo" | "Resumo";
  onTabChange: (tab: "Visao Geral" | "Fluxo" | "Resumo") => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const [selectedId, setSelectedId] = useState(map.hubId);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setSelectedId(map.hubId);
  }, [map.hubId]);

  useEffect(() => {
    function syncBounds() {
      const element = viewportRef.current;

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const nextBounds = {
        x: Math.max(0, (STAGE_WIDTH - rect.width) / 2),
        y: Math.max(0, (STAGE_HEIGHT - rect.height) / 2)
      };

      setBounds(nextBounds);
      setOffset((current) => ({
        x: clamp(current.x, -nextBounds.x, nextBounds.x),
        y: clamp(current.y, -nextBounds.y, nextBounds.y)
      }));
    }

    syncBounds();
    window.addEventListener("resize", syncBounds);

    return () => {
      window.removeEventListener("resize", syncBounds);
    };
  }, []);

  const locationMap = useMemo(
    () => new Map(map.locations.map((location) => [location.id, location])),
    [map.locations]
  );

  const selectedLocation = locationMap.get(selectedId) ?? map.locations[0];

  const tabCopy = {
    "Visao Geral": {
      eyebrow: "Radar global",
      helper: "Distribuicao visual das vendas ativas em diferentes mercados."
    },
    Fluxo: {
      eyebrow: "Fluxo ativo",
      helper: "Rotas acesas mostram como a operacao se espalha entre os polos de venda."
    },
    Resumo: {
      eyebrow: "Resumo geografico",
      helper: "Leia volume, pedidos e expansao por localidade sem sair do mapa."
    }
  } as const;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }

    const nextX = dragRef.current.originX + (event.clientX - dragRef.current.startX);
    const nextY = dragRef.current.originY + (event.clientY - dragRef.current.startY);

    setOffset({
      x: clamp(nextX, -bounds.x, bounds.x),
      y: clamp(nextY, -bounds.y, bounds.y)
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) {
      return;
    }

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section className="platform-surface rounded-[34px] p-5 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/34">{tabCopy[activeTab].eyebrow}</p>
          <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.06em] text-white sm:text-[2rem]">
            {map.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52">{tabCopy[activeTab].helper}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["Visao Geral", "Fluxo", "Resumo"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                activeTab === tab
                  ? "topics-gradient border-transparent text-[#09090b] shadow-[0_12px_28px_rgba(140,82,255,0.2)]"
                  : "border-white/8 bg-white/[0.03] text-white/54 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,16,24,0.98),rgba(11,14,19,0.99))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_28px_70px_rgba(0,0,0,0.26)] sm:p-4">
        <div className="mb-4 flex flex-col gap-3 px-2 pt-1 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/62">
              <Globe2 className="h-4 w-4 text-[#c4a6ff]" />
              {map.stats.countries} paises conectados
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/62">
              <MapPinned className="h-4 w-4 text-[#c4a6ff]" />
              {map.stats.regions} polos de venda
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/62">
              <Sparkles className="h-4 w-4 text-[#c4a6ff]" />
              {map.subtitle}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/58">
            <Grip className="h-4 w-4" />
            Arraste para explorar o mapa
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative min-h-[430px] overflow-hidden rounded-[26px] border border-white/7 bg-[radial-gradient(circle_at_top,rgba(140,82,255,0.08),transparent_28%),linear-gradient(180deg,#12141d_0%,#0c0f16_100%)] sm:min-h-[500px] xl:min-h-[560px]"
        >
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.28))]" />

          <div
            className="absolute left-1/2 top-1/2 h-[860px] w-[1880px] touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
            }}
          >
            <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} className="h-full w-full">
              <defs>
                <pattern id="map-dot-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2.4" cy="2.4" r="1.2" fill="rgba(196,166,255,0.24)" />
                </pattern>
                <pattern id="map-dot-grid-strong" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2.4" cy="2.4" r="1.35" fill="rgba(214,194,255,0.4)" />
                </pattern>
                <linearGradient id="map-route" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(140,82,255,0.08)" />
                  <stop offset="50%" stopColor="rgba(196,166,255,0.78)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                </linearGradient>
                <linearGradient id="continent-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.055)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </linearGradient>
                <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(196,166,255,0.9)" />
                  <stop offset="55%" stopColor="rgba(140,82,255,0.32)" />
                  <stop offset="100%" stopColor="rgba(140,82,255,0)" />
                </radialGradient>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="18" />
                </filter>
              </defs>

              <rect x="0" y="0" width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="transparent" />

              <g opacity="0.34">
                {latitudeLines.map((y, index) => (
                  <path
                    key={`lat-${y}`}
                    d={`M 26 ${y} C 440 ${y - 24 + index * 1.5}, 1440 ${y + 24 - index * 1.5}, 1854 ${y}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}
                {longitudeLines.map((x, index) => (
                  <path
                    key={`lng-${x}`}
                    d={`M ${x} 54 C ${x - 34 + (index % 2) * 8} 250, ${x + 34 - (index % 2) * 8} 610, ${x} 806`}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                ))}
              </g>

              <g opacity="0.9">
                {continentShapes.map((shape, index) => (
                  <g key={shape.id}>
                    <path
                      d={shape.d}
                      fill="url(#continent-fill)"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="2.2"
                    />
                    <path
                      d={shape.d}
                      fill={index < 2 ? "url(#map-dot-grid-strong)" : "url(#map-dot-grid)"}
                      opacity={0.88 - Math.min(index, 7) * 0.045}
                    />
                  </g>
                ))}
              </g>

              <ellipse
                cx="940"
                cy="434"
                rx="610"
                ry="250"
                fill="rgba(140,82,255,0.085)"
                filter="url(#softGlow)"
              />

              {map.routes.map((route) => {
                const from = locationMap.get(route.fromId);
                const to = locationMap.get(route.toId);

                if (!from || !to) {
                  return null;
                }

                return (
                  <path
                    key={route.id}
                    d={buildRoutePath(from, to)}
                    fill="none"
                    stroke="url(#map-route)"
                    strokeWidth={route.fromId === map.hubId ? 3 : 2}
                    strokeLinecap="round"
                    opacity={activeTab === "Resumo" ? 0.42 : 0.86}
                    strokeDasharray={activeTab === "Fluxo" ? "0 0" : "7 10"}
                  />
                );
              })}

              {map.locations.map((location) => {
                const x = (location.x / 100) * STAGE_WIDTH;
                const y = (location.y / 100) * STAGE_HEIGHT;
                const selected = location.id === selectedLocation.id;

                return (
                  <g
                    key={location.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(location.id)}
                    transform={`translate(${x} ${y})`}
                  >
                    <circle r="28" fill="url(#map-glow)" opacity={selected ? 0.9 : 0.55} />
                    <circle r="10" fill={selected ? "#ffffff" : "#c4a6ff"} opacity={0.2} />
                    <circle r="5.5" fill={selected ? "#ffffff" : "#c4a6ff"} />
                    <circle r="2.2" fill="#09090b" opacity={0.36} />

                    {selected ? (
                      <g transform="translate(16 -18)">
                        <rect
                          width="180"
                          height="40"
                          rx="20"
                          fill="rgba(10,12,18,0.86)"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <text x="14" y="16" fill="rgba(255,255,255,0.48)" fontSize="10" letterSpacing="2">
                          LOCALIDADE
                        </text>
                        <text x="14" y="29" fill="#ffffff" fontSize="13" fontWeight="600">
                          {location.city}, {location.country}
                        </text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3 sm:left-5 sm:right-5 sm:top-5">
            <div className="rounded-[22px] border border-white/8 bg-[rgba(9,11,16,0.68)] px-4 py-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/32">Live sales tracking</p>
              <p className="mt-2 text-sm text-white/62">Toque nos pontos para alternar a localidade em foco.</p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="rounded-full border border-white/8 bg-[rgba(9,11,16,0.62)] px-3 py-2 text-xs text-white/60 backdrop-blur-xl">
                Hoje
              </div>
              <div className="rounded-full border border-white/8 bg-[rgba(9,11,16,0.62)] px-3 py-2 text-xs text-white/60 backdrop-blur-xl">
                Operacao global
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-[2] w-[min(340px,calc(100%-2rem))] rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(20,23,31,0.92),rgba(12,15,22,0.96))] p-4 shadow-[0_22px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:left-5 sm:bottom-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/32">{activeTab}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                  {selectedLocation.city}
                </h3>
                <p className="mt-1 text-sm text-white/52">{selectedLocation.country}</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-[#c4a6ff]">
                <Radar className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/56">{selectedLocation.spotlight}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Volume</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(selectedLocation.amount)}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Pedidos</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedLocation.orders}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-full border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-white/64">
              <span>Explorar mapa</span>
              <MoveRight className="h-4 w-4 text-white/44" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Volume total</p>
            <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
              {formatCurrency(map.locations.reduce((total, item) => total + item.amount, 0))}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Paises</p>
            <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">{map.stats.countries}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Pedidos globais</p>
            <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">{map.stats.orders}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/30">Hub principal</p>
            <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
              {locationMap.get(map.hubId)?.city ?? "TOPICS Pay"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
