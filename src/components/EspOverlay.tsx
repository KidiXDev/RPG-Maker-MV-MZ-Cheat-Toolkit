import { useEffect, useRef } from 'react';
import { getMinimapData } from '../game/cheats/minimap.ts';
import { useCheatStore } from '../store/useCheatStore.ts';

const TRIGGER_COLORS: Record<number, string> = {
  0: '#60a5fa', // Action – blue
  1: '#fbbf24', // Player Touch – amber
  2: '#f97316', // Event Touch – orange
  3: '#4ade80', // Autorun – green
  4: '#a78bfa', // Parallel – purple
};

function getTriggerColor(trigger: number): string {
  return TRIGGER_COLORS[trigger] ?? '#e2e8f0';
}

/**
 * EspOverlay — renders a <canvas> directly on document.body (outside Shadow DOM)
 * so it overlays the game canvas. pointer-events: none ensures clicks pass through.
 */
export function EspOverlay() {
  const espEnabled = useCheatStore((s) => s.espEnabled);
  const gameReady = useCheatStore((s) => s.gameReady);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!espEnabled || !gameReady) return;

    // Create canvas directly on body, not inside shadow root
    const canvas = document.createElement('canvas');
    canvas.id = 'rmc-esp-canvas';
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:2147483646',
    ].join(';');
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const data = getMinimapData();
      if (!data || data.width === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const tileW = data.tileWidth || 48;
      const tileH = data.tileHeight || 48;
      const displayX = data.displayX;
      const displayY = data.displayY;

      // Convert tile coord to screen pixel (accounting for scroll offset)
      function tileToScreen(tx: number, ty: number): [number, number] {
        const screenX = (tx - displayX) * tileW;
        const screenY = (ty - displayY) * tileH;
        return [screenX, screenY];
      }

      ctx.save();

      // Draw event markers
      for (const ev of data.events) {
        const [sx, sy] = tileToScreen(ev.x, ev.y);

        // Skip if off-screen
        if (sx < -tileW || sx > canvas.width + tileW || sy < -tileH || sy > canvas.height + tileH) {
          continue;
        }

        const color = getTriggerColor(ev.trigger);
        const cx = sx + tileW / 2;
        const cy = sy + tileH / 2;

        // Diamond marker
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color + '40'; // semi-transparent fill
        ctx.lineWidth = 2;
        const r = 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Self-switch indicators (tiny dots)
        const sws = ev.selfSwitches;
        const swKeys = ['A', 'B', 'C', 'D'] as const;
        swKeys.forEach((k, i) => {
          if (sws[k]) {
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(cx - 6 + i * 4, cy + r + 6, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Label above marker
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Adjusted textBaseline for better alignment

        // Shadow for readability
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(ev.name.length > 14 ? ev.name.slice(0, 13) + '…' : ev.name, cx, cy - r - 8);
        ctx.fillStyle = color;
        ctx.fillText(ev.name.length > 14 ? ev.name.slice(0, 13) + '…' : ev.name, cx, cy - r - 8);

        ctx.restore();
      }

      // Draw player marker
      const [px, py] = tileToScreen(data.playerX, data.playerY);
      const pcx = px + tileW / 2;
      const pcy = py + tileH / 2;

      // Outer glow ring
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(pcx, pcy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner white dot
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pcx, pcy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [espEnabled, gameReady]);

  return null; // No DOM output — the canvas is managed imperatively
}
