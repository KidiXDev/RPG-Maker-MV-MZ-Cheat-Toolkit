import { useEffect, useRef, useState } from 'react';
import { getMinimapData, type MinimapData, type MinimapEventEntry } from '../game/cheats/minimap.ts';
import { teleportTo } from '../game/cheats/teleport.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { Button } from '../components/ui/index.ts';
import { PanelHeader } from './PanelHeader.tsx';

// Trigger colors matching ESP overlay
const TRIGGER_COLORS: Record<number, string> = {
  0: '#60a5fa',
  1: '#fbbf24',
  2: '#f97316',
  3: '#4ade80',
  4: '#a78bfa',
};

const TRIGGER_LABELS: Record<number, string> = {
  0: 'Action',
  1: 'Player Touch',
  2: 'Event Touch',
  3: 'Autorun',
  4: 'Parallel',
};

const MAX_CANVAS_DIM = 480; // max px for canvas axis

function computeCellSize(width: number, height: number): number {
  const byWidth = width > 0 ? Math.floor(MAX_CANVAS_DIM / width) : 6;
  const byHeight = height > 0 ? Math.floor(MAX_CANVAS_DIM / height) : 6;
  return Math.max(2, Math.min(byWidth, byHeight, 16));
}

function drawMinimap(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  hoveredTile: { x: number; y: number } | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cell = computeCellSize(data.width, data.height);
  const canvasW = data.width * cell;
  const canvasH = data.height * cell;

  canvas.width = canvasW;
  canvas.height = canvasH;

  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Passability grid
  if (data.passable.length > 0) {
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const pass = data.passable[y]?.[x] ?? false;
        ctx.fillStyle = pass ? '#1e2d20' : '#151a22';
        ctx.fillRect(x * cell, y * cell, cell, cell);

        // subtle grid line
        if (cell >= 4) {
          ctx.strokeStyle = pass ? '#243829' : '#1c2236';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
        }
      }
    }
  } else {
    // No passability data — just draw a flat map rectangle
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Hovered tile highlight
  if (hoveredTile) {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
    ctx.fillRect(hoveredTile.x * cell, hoveredTile.y * cell, cell, cell);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hoveredTile.x * cell + 0.5, hoveredTile.y * cell + 0.5, cell - 1, cell - 1);
  }

  // Events
  for (const ev of data.events) {
    const ex = ev.x * cell + cell / 2;
    const ey = ev.y * cell + cell / 2;
    const color = TRIGGER_COLORS[ev.trigger] ?? '#e2e8f0';
    const r = Math.max(2, cell / 2 - 1);

    // Diamond
    ctx.save();
    ctx.fillStyle = color + '55';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex, ey - r);
    ctx.lineTo(ex + r, ey);
    ctx.lineTo(ex, ey + r);
    ctx.lineTo(ex - r, ey);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Player
  const px = data.playerX * cell + cell / 2;
  const py = data.playerY * cell + cell / 2;
  const pr = Math.max(3, cell / 2);

  ctx.save();
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py, Math.max(1, pr - 2), 0, Math.PI * 2);
  ctx.fill();
}

export function MinimapPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<MinimapData | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<MinimapEventEntry | null>(null);
  const [lastTeleport, setLastTeleport] = useState<string>('');
  const espEnabled = useCheatStore((s) => s.espEnabled);
  const setEspEnabled = useCheatStore((s) => s.setEspEnabled);
  const pushToast = useCheatStore((s) => s.pushToast);

  // Periodic refresh
  useEffect(() => {
    function refresh() {
      const d = getMinimapData();
      setData(d);
    }
    refresh();
    const id = window.setInterval(refresh, 500);
    return () => window.clearInterval(id);
  }, []);

  // Redraw canvas when data or hover changes
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    drawMinimap(canvasRef.current, data, hoveredTile);
  }, [data, hoveredTile]);

  function getCanvasTile(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    if (!canvasRef.current || !data) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const cell = computeCellSize(data.width, data.height);
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const tx = Math.floor((mx * scaleX) / cell);
    const ty = Math.floor((my * scaleY) / cell);
    if (tx < 0 || ty < 0 || tx >= data.width || ty >= data.height) return null;
    return { x: tx, y: ty };
  }

  function findEventAtTile(tx: number, ty: number): MinimapEventEntry | null {
    return data?.events.find((ev) => ev.x === tx && ev.y === ty) ?? null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const tile = getCanvasTile(e);
    setHoveredTile(tile);
    setHoveredEvent(tile ? findEventAtTile(tile.x, tile.y) : null);
  }

  function handleMouseLeave() {
    setHoveredTile(null);
    setHoveredEvent(null);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const tile = getCanvasTile(e);
    if (!tile || !data) return;
    teleportTo(data.mapId, tile.x, tile.y);
    setLastTeleport(`(${tile.x}, ${tile.y})`);
    pushToast(`Teleported to (${tile.x}, ${tile.y})`);
  }

  const hasData = data && data.width > 0;

  return (
    <section className="flex flex-col h-full">
      <PanelHeader
        title="Minimap"
        description={
          hasData
            ? `Map #${data.mapId} — ${data.width}×${data.height} tiles. Click to teleport.`
            : 'Minimap — load a map in-game to see data.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">
        {/* Left Column: Canvas, Controls, Legend */}
        <div className="flex flex-col">
          {/* Controls row */}
          <div className="mb-3 flex items-center flex-wrap">
            <button
              type="button"
              className={`mr-3 rounded-lg px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                espEnabled
                  ? 'bg-rmc-aether/20 border-rmc-aether text-rmc-aether'
                  : 'bg-white/10 border-white/10 text-rmc-slate hover:bg-white/20 hover:text-rmc-mist'
              }`}
              onClick={() => setEspEnabled(!espEnabled)}
            >
              {espEnabled ? '● ESP ON' : '○ ESP OFF'}
            </button>
            {lastTeleport && (
              <span className="mr-3 text-xs text-rmc-slate">Last: {lastTeleport}</span>
            )}
            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setData(getMinimapData())}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="mb-3 flex items-center justify-center p-4 rounded-xl border border-white/10 bg-rmc-abyss/60 overflow-auto min-h-[300px]">
            {hasData ? (
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair rounded-lg border"
                style={{
                  maxWidth: '100%',
                  imageRendering: 'pixelated',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              />
            ) : (
              <div className="py-16 text-center text-rmc-slate text-sm">
                No map data — open a map in-game first.
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap text-xs text-rmc-slate">
            {Object.entries(TRIGGER_LABELS).map(([trigger, label]) => (
              <span key={trigger} className="mr-3 mb-2 flex items-center">
                <span
                  className="mr-1.5 inline-block w-2.5 h-2.5 rounded-full border"
                  style={{
                    background: TRIGGER_COLORS[Number(trigger)] ?? '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                  }}
                />
                {label}
              </span>
            ))}
            <span className="mr-3 mb-2 flex items-center">
              <span className="mr-1.5 inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/15" />
              Player
            </span>
            <span className="mr-3 mb-2 flex items-center">
              <span
                className="mr-1.5 inline-block w-2.5 h-2.5 rounded border"
                style={{
                  background: '#1e2d20',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
              Passable
            </span>
            <span className="mr-3 mb-2 flex items-center">
              <span
                className="mr-1.5 inline-block w-2.5 h-2.5 rounded border"
                style={{
                  background: '#151a22',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
              Blocked
            </span>
          </div>
        </div>

        {/* Right Column: Inspector Panel */}
        <div className="rounded-xl border border-white/10 bg-rmc-ink/80 p-4 min-h-[320px] flex flex-col">
          <h3 className="text-xs font-bold tracking-wider text-rmc-slate uppercase mb-3 border-b border-white/10 pb-1.5">
            Map Inspector
          </h3>

          {hasData ? (
            <div className="flex-1 flex flex-col">
              <div>
                {/* Tile/Event details */}
                {hoveredTile ? (
                  <div>
                    {/* Position info */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-rmc-slate">Coords:</span>
                      <span className="text-rmc-mist font-semibold">
                        ({hoveredTile.x}, {hoveredTile.y})
                      </span>
                    </div>

                    {/* Passability indicator */}
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="text-rmc-slate">Passability:</span>
                      {data.passable.length > 0 ? (
                        data.passable[hoveredTile.y]?.[hoveredTile.x] ? (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border"
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderColor: 'rgba(16, 185, 129, 0.2)',
                            }}
                          >
                            Passable
                          </span>
                        ) : (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.2)',
                            }}
                          >
                            Blocked
                          </span>
                        )
                      ) : (
                        <span className="text-rmc-slate italic">Unknown</span>
                      )}
                    </div>

                    {/* Event Detail if hovered */}
                    {hoveredEvent ? (
                      <div className="mt-3.5 pt-3.5 border-t border-white/5">
                        <div className="text-[10px] text-rmc-slate font-mono uppercase tracking-wider mb-2">
                          Event Node
                        </div>

                        <div className="mb-3">
                          <div className="text-xs font-bold text-rmc-mist truncate" title={hoveredEvent.name}>
                            {hoveredEvent.name}
                          </div>
                          <div className="text-[10px] text-rmc-slate font-mono">
                            ID: #{hoveredEvent.id}
                          </div>
                        </div>

                        {/* Trigger badge */}
                        <div className="mb-3">
                          <div className="text-[10px] text-rmc-slate mb-1">Trigger</div>
                          <span
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border"
                            style={{
                              backgroundColor: (TRIGGER_COLORS[hoveredEvent.trigger] ?? '#e2e8f0') + '15',
                              borderColor: TRIGGER_COLORS[hoveredEvent.trigger] ?? '#e2e8f0',
                              color: TRIGGER_COLORS[hoveredEvent.trigger] ?? '#e2e8f0',
                            }}
                          >
                            {TRIGGER_LABELS[hoveredEvent.trigger] ?? `Trigger ${hoveredEvent.trigger}`}
                          </span>
                        </div>

                        {/* Self Switches */}
                        <div>
                          <div className="text-[10px] text-rmc-slate mb-1.5">Self Switches</div>
                          <div className="flex">
                            {(['A', 'B', 'C', 'D'] as const).map((k) => {
                              const active = hoveredEvent.selfSwitches[k];
                              return (
                                <span
                                  key={k}
                                  className="mr-1.5 inline-block w-5 h-5 rounded-full text-center leading-5 text-[10px] font-bold border transition-colors duration-150"
                                  style={{
                                    backgroundColor: active
                                      ? 'rgba(255, 179, 92, 0.2)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                    borderColor: active ? '#ffb35c' : 'rgba(255, 255, 255, 0.08)',
                                    color: active ? '#ffb35c' : 'var(--color-rmc-slate)',
                                  }}
                                >
                                  {k}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="mt-4 text-center py-6 text-rmc-slate text-[11px] border border-dashed rounded-lg px-2"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        Hover over a grid event indicator (diamond) to inspect details.
                      </div>
                    )}
                  </div>
                ) : (
                  // Default Map Info
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="text-rmc-slate">Map ID:</span>
                      <span className="text-rmc-mist font-semibold">#{data.mapId}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="text-rmc-slate">Dimensions:</span>
                      <span className="text-rmc-mist font-semibold">
                        {data.width} × {data.height}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="text-rmc-slate">Total Events:</span>
                      <span className="text-rmc-mist font-semibold">
                        {data.events.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-4">
                      <span className="text-rmc-slate">Player Pos:</span>
                      <span className="text-rmc-mist font-mono font-semibold">
                        ({data.playerX}, {data.playerY})
                      </span>
                    </div>

                    <div
                      className="text-center py-6 text-rmc-slate text-[11px] border border-dashed rounded-lg px-2"
                      style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      Hover map grid to inspect coordinate details and event self-switches.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-rmc-slate">
              Waiting for game map data...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

