import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/index.ts';
import {
  getMinimapData,
  type MinimapData,
  type MinimapEventEntry
} from '../game/cheats/minimap.ts';
import {
  drawMinimap,
  findMinimapEventAtTile,
  getCanvasTile,
  TRIGGER_COLORS,
  TRIGGER_LABELS
} from '../game/cheats/minimapRender.ts';
import { teleportTo } from '../game/cheats/teleport.ts';
import { useCheatStore } from '../store/useCheatStore.ts';
import { PanelHeader } from './PanelHeader.tsx';

export function MinimapPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<MinimapData | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<MinimapEventEntry | null>(
    null
  );
  const [lastTeleport, setLastTeleport] = useState<string>('');
  const espEnabled = useCheatStore((s) => s.espEnabled);
  const setEspEnabled = useCheatStore((s) => s.setEspEnabled);
  const minimapOverlayEnabled = useCheatStore((s) => s.minimapOverlayEnabled);
  const minimapOverlayOpacity = useCheatStore((s) => s.minimapOverlayOpacity);
  const setMinimapOverlayEnabled = useCheatStore(
    (s) => s.setMinimapOverlayEnabled
  );
  const setMinimapOverlayOpacity = useCheatStore(
    (s) => s.setMinimapOverlayOpacity
  );
  const resetMinimapOverlayPosition = useCheatStore(
    (s) => s.resetMinimapOverlayPosition
  );
  const pushToast = useCheatStore((s) => s.pushToast);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const getCellSize = (mapWidth: number, mapHeight: number) => {
    // Fill the shape by using Math.max of horizontal and vertical fit ratios
    const fitCell = Math.max(
      Math.ceil(480 / mapWidth),
      Math.ceil(330 / mapHeight)
    );
    // Add +2 to zoom in further, ensuring no black gaps, capped at 32
    return Math.max(2, Math.min(32, fitCell + 2));
  };

  const clampPanOffset = (
    val: { x: number; y: number },
    mapWidth: number,
    mapHeight: number,
    cell: number
  ) => {
    const canvasW = 480;
    const canvasH = 330;
    const mapWPx = mapWidth * cell;
    const mapHPx = mapHeight * cell;

    let x = val.x;
    let y = val.y;

    if (mapWPx > canvasW) {
      const limitX = (mapWPx - canvasW) / (2 * cell);
      x = Math.max(-limitX, Math.min(limitX, x));
    } else {
      x = 0;
    }

    if (mapHPx > canvasH) {
      const limitY = (mapHPx - canvasH) / (2 * cell);
      y = Math.max(-limitY, Math.min(limitY, y));
    } else {
      y = 0;
    }

    return { x, y };
  };

  // Periodic refresh
  useEffect(() => {
    let lastMapKey = '';

    function refresh() {
      const d = getMinimapData();
      setData(d);

      const newKey = d ? `${d.mapId}-${d.width}-${d.height}` : '';
      if (newKey !== lastMapKey) {
        lastMapKey = newKey;
        setPanOffset({ x: 0, y: 0 });
      }
    }
    refresh();
    const id = window.setInterval(refresh, 500);
    return () => window.clearInterval(id);
  }, []);

  // Redraw canvas when data, hover, or pan offset changes
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const cell = getCellSize(data.width, data.height);
    drawMinimap(canvasRef.current, data, {
      hoveredTile,
      viewport: {
        centerX: data.width / 2 + panOffset.x,
        centerY: data.height / 2 + panOffset.y,
        cell
      }
    });
  }, [data, hoveredTile, panOffset]);

  function getPanelCanvasTile(
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null {
    if (!canvasRef.current || !data) return null;
    const cell = getCellSize(data.width, data.height);
    return getCanvasTile(canvasRef.current, data, e.clientX, e.clientY, {
      viewport: {
        centerX: data.width / 2 + panOffset.x,
        centerY: data.height / 2 + panOffset.y,
        cell
      }
    });
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button === 2) {
      // Right click
      isDraggingRef.current = true;
      setIsDragging(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (isDraggingRef.current && data) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const cell = getCellSize(data.width, data.height);
      setPanOffset((prev) => {
        const nextX = prev.x - dx / cell;
        const nextY = prev.y - dy / cell;
        return clampPanOffset(
          { x: nextX, y: nextY },
          data.width,
          data.height,
          cell
        );
      });
      e.preventDefault(); // Prevent text selection or browser default drag cursor overrides
    } else {
      const tile = getPanelCanvasTile(e);
      setHoveredTile(tile);
      setHoveredEvent(
        tile ? findMinimapEventAtTile(data, tile.x, tile.y) : null
      );
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button === 2) {
      isDraggingRef.current = false;
      setIsDragging(false);
      e.preventDefault();
    }
  }

  function handleMouseLeave() {
    isDraggingRef.current = false;
    setIsDragging(false);
    setHoveredTile(null);
    setHoveredEvent(null);
  }

  function handleContextMenu(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return; // Left click only
    const tile = getPanelCanvasTile(e);
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

      {/* Unified compact toolbar for both ESP and HUD Overlay */}
      <div className="mb-3 flex items-center justify-between flex-wrap p-2 rounded-lg border border-white/10 bg-white/5 text-xs">
        {hasData ? (
          <div className="flex items-center flex-wrap">
            {/* ESP Toggle */}
            <button
              type="button"
              className={`mr-3 rounded-lg px-2.5 py-1.5 font-semibold border transition cursor-pointer ${
                espEnabled
                  ? 'bg-rmc-aether/20 border-rmc-aether text-rmc-aether'
                  : 'bg-white/10 border-white/10 text-rmc-slate hover:bg-white/20 hover:text-rmc-mist'
              }`}
              onClick={() => setEspEnabled(!espEnabled)}
            >
              {espEnabled ? '● ESP ON' : '○ ESP OFF'}
            </button>

            {/* HUD Overlay Toggle */}
            <div className="mr-4 flex items-center">
              <label className="cursor-pointer flex items-center text-rmc-mist font-semibold">
                <input
                  className="mr-1.5 h-4 w-4 accent-rmc-ember cursor-pointer"
                  type="checkbox"
                  checked={minimapOverlayEnabled}
                  onChange={(e) => setMinimapOverlayEnabled(e.target.checked)}
                />
                HUD Overlay
              </label>
            </div>

            {/* Opacity Slider - Inline compact version */}
            {minimapOverlayEnabled && (
              <div className="mr-4 flex items-center">
                <span className="text-rmc-slate mr-2">Opacity:</span>
                <input
                  type="range"
                  className="rmc-slider w-20 h-1 rounded appearance-none cursor-pointer bg-white/10
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-rmc-ember"
                  min={0.25}
                  max={1}
                  step={0.05}
                  value={minimapOverlayOpacity}
                  onChange={(e) =>
                    setMinimapOverlayOpacity(Number(e.target.value))
                  }
                />
                <span className="text-rmc-ember ml-1.5 font-mono">
                  {Math.round(minimapOverlayOpacity * 100)}%
                </span>
              </div>
            )}

            {/* Reset position button */}
            {minimapOverlayEnabled && (
              <button
                type="button"
                className="rounded px-2 py-1 text-[10px] font-semibold border border-white/10 text-rmc-slate hover:bg-white/10 hover:text-rmc-mist transition cursor-pointer"
                onClick={resetMinimapOverlayPosition}
              >
                Reset Position
              </button>
            )}
          </div>
        ) : (
          <div className="text-rmc-slate font-medium pl-1">
            No active session
          </div>
        )}

        <div className="flex items-center ml-auto">
          {hasData && lastTeleport && (
            <span className="mr-3 text-[11px] text-rmc-slate font-mono">
              Last Teleport: {lastTeleport}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setData(getMinimapData())}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">
        {/* Left Column: Canvas, Legend */}
        <div className="flex flex-col">
          {/* Canvas Wrapper */}
          <div className="mb-3 flex items-center justify-center p-2 rounded-xl border border-white/10 bg-rmc-abyss/60 overflow-auto h-[330px]">
            {hasData ? (
              <canvas
                ref={canvasRef}
                width={480}
                height={330}
                className={`block rounded-lg border select-none ${
                  isDragging ? 'cursor-move' : 'cursor-pointer'
                }`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleContextMenu}
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
                    borderColor: 'rgba(255, 255, 255, 0.15)'
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
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              />
              Passable
            </span>
            <span className="mr-3 mb-2 flex items-center">
              <span
                className="mr-1.5 inline-block w-2.5 h-2.5 rounded border"
                style={{
                  background: '#151a22',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              />
              Blocked
            </span>
          </div>
        </div>

        {/* Right Column: Inspector Sidebar (Fixed Height) */}
        <div className="rounded-xl border border-white/10 bg-rmc-ink/80 p-4 h-[360px] flex flex-col">
          <h3 className="text-xs font-bold tracking-wider text-rmc-slate uppercase mb-3 border-b border-white/10 pb-1.5">
            Map Inspector
          </h3>

          {hasData ? (
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
                            borderColor: 'rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          Passable
                        </span>
                      ) : (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderColor: 'rgba(239, 68, 68, 0.2)'
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
                        <div
                          className="text-xs font-bold text-rmc-mist truncate"
                          title={hoveredEvent.name}
                        >
                          {hoveredEvent.name}
                        </div>
                        <div className="text-[10px] text-rmc-slate font-mono">
                          ID: #{hoveredEvent.id}
                        </div>
                      </div>

                      {/* Trigger badge */}
                      <div className="mb-3">
                        <div className="text-[10px] text-rmc-slate mb-1">
                          Trigger
                        </div>
                        <span
                          className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold border"
                          style={{
                            backgroundColor:
                              (TRIGGER_COLORS[hoveredEvent.trigger] ??
                                '#e2e8f0') + '15',
                            borderColor:
                              TRIGGER_COLORS[hoveredEvent.trigger] ?? '#e2e8f0',
                            color:
                              TRIGGER_COLORS[hoveredEvent.trigger] ?? '#e2e8f0'
                          }}
                        >
                          {TRIGGER_LABELS[hoveredEvent.trigger] ??
                            `Trigger ${hoveredEvent.trigger}`}
                        </span>
                      </div>

                      {/* Self Switches */}
                      <div>
                        <div className="text-[10px] text-rmc-slate mb-1.5">
                          Self Switches
                        </div>
                        <div className="flex">
                          {(['A', 'B', 'C', 'D'] as const).map((k) => {
                            const active = hoveredEvent.selfSwitches[k];
                            return (
                              <span
                                key={k}
                                className="mr-1.5 inline-block rounded-full text-center font-bold border transition-colors duration-150"
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  lineHeight: '16px',
                                  fontSize: '9px',
                                  backgroundColor: active
                                    ? 'rgba(255, 179, 92, 0.2)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  borderColor: active
                                    ? '#ffb35c'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  color: active
                                    ? '#ffb35c'
                                    : 'var(--color-rmc-slate)'
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
                      Hover over a grid event indicator (diamond) to inspect
                      details.
                    </div>
                  )}
                </div>
              ) : (
                // Default Map Info
                <div>
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="text-rmc-slate">Map ID:</span>
                    <span className="text-rmc-mist font-semibold">
                      #{data.mapId}
                    </span>
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
                    Hover map grid to inspect coordinate details and event
                    self-switches.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-rmc-slate py-8">
              Waiting for game map data...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
