import { useEffect, useRef, useState } from 'react';
import { Toggle } from '../components/Toggle.tsx';
import { Button, Slider } from '../components/ui/index.ts';
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
    drawMinimap(canvasRef.current, data, { hoveredTile });
  }, [data, hoveredTile]);

  function getPanelCanvasTile(
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null {
    if (!canvasRef.current || !data) return null;
    return getCanvasTile(canvasRef.current, data, e.clientX, e.clientY);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const tile = getPanelCanvasTile(e);
    setHoveredTile(tile);
    setHoveredEvent(tile ? findMinimapEventAtTile(data, tile.x, tile.y) : null);
  }

  function handleMouseLeave() {
    setHoveredTile(null);
    setHoveredEvent(null);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
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
              <span className="mr-3 text-xs text-rmc-slate">
                Last: {lastTeleport}
              </span>
            )}
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setData(getMinimapData())}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="mb-3 grid gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <Toggle
              checked={minimapOverlayEnabled}
              label="Enable circular minimap overlay"
              onChange={setMinimapOverlayEnabled}
            />
            <Slider
              label="Overlay opacity"
              value={minimapOverlayOpacity}
              min={0.25}
              max={1}
              step={0.05}
              instant
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onReset={() => setMinimapOverlayOpacity(0.85)}
              resetLabel="Reset to 85%"
              onChange={setMinimapOverlayOpacity}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-rmc-slate">
                Drag to reposition. The cropped map follows the player.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetMinimapOverlayPosition}
              >
                Reset
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
                  borderColor: 'rgba(255, 255, 255, 0.08)'
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
                                TRIGGER_COLORS[hoveredEvent.trigger] ??
                                '#e2e8f0',
                              color:
                                TRIGGER_COLORS[hoveredEvent.trigger] ??
                                '#e2e8f0'
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
                                  className="mr-1.5 inline-block w-5 h-5 rounded-full text-center leading-5 text-[10px] font-bold border transition-colors duration-150"
                                  style={{
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
