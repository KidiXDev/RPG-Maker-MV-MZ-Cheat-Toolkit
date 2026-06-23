import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getCurrentMapInfo,
  getFps,
  getPlayerPosition,
  getRunningEvents,
  startFpsTracking,
  stopFpsTracking,
  type RunningEventInfo
} from '../game/cheats/debug.ts';
import { useCheatStore, type HudPosition } from '../store/useCheatStore.ts';

type DebugData = {
  fps: number;
  map: { name: string; id: number };
  pos: { x: number; y: number };
  events: RunningEventInfo[];
};

const POSITION_CLASSES: Record<HudPosition, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3'
};

export function OverlayHud({ portalRoot }: { portalRoot?: HTMLElement }) {
  const hudEnabled = useCheatStore((state) => state.hudEnabled);
  const hudPosition = useCheatStore((state) => state.hudPosition);
  const hudShowFps = useCheatStore((state) => state.hudShowFps);
  const hudShowMap = useCheatStore((state) => state.hudShowMap);
  const hudShowCoords = useCheatStore((state) => state.hudShowCoords);
  const hudShowEvents = useCheatStore((state) => state.hudShowEvents);

  const [data, setData] = useState<DebugData>({
    fps: 0,
    map: { name: '', id: 0 },
    pos: { x: 0, y: 0 },
    events: []
  });

  const anyVisible = hudShowFps || hudShowMap || hudShowCoords || hudShowEvents;

  useEffect(() => {
    if (!hudEnabled || !anyVisible) return;

    startFpsTracking();

    const interval = window.setInterval(() => {
      setData({
        fps: getFps(),
        map: getCurrentMapInfo(),
        pos: getPlayerPosition(),
        events: getRunningEvents()
      });
    }, 100);

    return () => {
      window.clearInterval(interval);
      stopFpsTracking();
    };
  }, [hudEnabled, anyVisible]);

  if (!hudEnabled || !anyVisible) return null;

  const content = (
    <div
      className={`pointer-events-none fixed z-9999 ${POSITION_CLASSES[hudPosition]}`}
    >
      <div className="rounded-lg border border-white/10 bg-rmc-abyss/85 px-3 py-2 font-rmc-mono text-xs leading-5 text-rmc-mist shadow-rmc-panel">
        {hudShowFps && (
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-rmc-slate">FPS</span>
            <span
              className={data.fps < 30 ? 'text-rmc-danger' : 'text-rmc-ember'}
            >
              {data.fps}
            </span>
          </div>
        )}
        {hudShowMap && (
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-rmc-slate">Map</span>
            <span className="text-rmc-mist">
              {data.map.name}
              <span className="text-rmc-slate"> #{data.map.id}</span>
            </span>
          </div>
        )}
        {hudShowCoords && (
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-rmc-slate">Pos</span>
            <span className="text-rmc-mist">
              ({data.pos.x}, {data.pos.y})
            </span>
          </div>
        )}
        {hudShowEvents && (
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-rmc-slate">Events</span>
            {data.events.length === 0 ? (
              <span className="text-rmc-slate">None</span>
            ) : (
              <div className="mt-0.5 grid gap-0.5">
                {data.events.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="text-rmc-aether">
                    #{ev.id} {ev.name}
                    <span className="text-rmc-slate"> p{ev.page}</span>
                  </div>
                ))}
                {data.events.length > 5 && (
                  <span className="text-rmc-slate">
                    +{data.events.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
}
