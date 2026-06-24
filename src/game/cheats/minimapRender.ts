import type { MinimapData, MinimapEventEntry } from './minimap.ts';

export const TRIGGER_COLORS: Record<number, string> = {
  0: '#60a5fa',
  1: '#fbbf24',
  2: '#f97316',
  3: '#4ade80',
  4: '#a78bfa'
};

export const TRIGGER_LABELS: Record<number, string> = {
  0: 'Action',
  1: 'Player Touch',
  2: 'Event Touch',
  3: 'Autorun',
  4: 'Parallel'
};

const MAX_CANVAS_DIM = 320;

type DrawMinimapOptions = {
  hoveredTile?: { x: number; y: number } | null;
  clipCircle?: boolean;
  fitToCanvas?: boolean;
  viewport?: MinimapViewport;
};

export type MinimapViewport = {
  centerX: number;
  centerY: number;
  cell: number;
};

type CanvasTileOptions =
  | boolean
  | {
      fitToCanvas?: boolean;
      viewport?: MinimapViewport;
    };

export function computeCellSize(width: number, height: number): number {
  const byWidth = width > 0 ? Math.floor(MAX_CANVAS_DIM / width) : 6;
  const byHeight = height > 0 ? Math.floor(MAX_CANVAS_DIM / height) : 6;
  return Math.max(2, Math.min(byWidth, byHeight, 16));
}

export function getCanvasTile(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  clientX: number,
  clientY: number,
  options: CanvasTileOptions = false
): { x: number; y: number } | null {
  const normalizedOptions =
    typeof options === 'boolean' ? { fitToCanvas: options } : options;
  const rect = canvas.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = mx * scaleX;
  const canvasY = my * scaleY;
  const viewport = getMapViewport(canvas, data, normalizedOptions);

  if (
    canvasX < viewport.left ||
    canvasY < viewport.top ||
    canvasX > viewport.left + viewport.width ||
    canvasY > viewport.top + viewport.height
  ) {
    return null;
  }

  const tx = Math.floor((canvasX - viewport.left) / viewport.cell);
  const ty = Math.floor((canvasY - viewport.top) / viewport.cell);
  if (tx < 0 || ty < 0 || tx >= data.width || ty >= data.height) return null;
  return { x: tx, y: ty };
}

export function findMinimapEventAtTile(
  data: MinimapData | null,
  tx: number,
  ty: number
): MinimapEventEntry | null {
  return data?.events.find((ev) => ev.x === tx && ev.y === ty) ?? null;
}

export function drawMinimap(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  options: DrawMinimapOptions = {}
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (!options.fitToCanvas && !options.viewport) {
    const cell = computeCellSize(data.width, data.height);
    canvas.width = data.width * cell;
    canvas.height = data.height * cell;
  }

  const viewport = getMapViewport(canvas, data, options);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#06080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (options.clipCircle) {
    // If clipping a circle, we clip slightly inside the border (leave 12px margin for the compass bezel)
    const margin = 12;
    const radius = Math.min(canvas.width, canvas.height) / 2 - margin;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.fillStyle = '#06080c';
  ctx.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);

  drawTiles(ctx, data, viewport);
  drawHoveredTile(ctx, viewport, options.hoveredTile ?? null);

  if (options.clipCircle) {
    drawHUDCrosshair(ctx, canvas.width, canvas.height);
  }

  drawEvents(ctx, data, viewport);
  drawPlayer(ctx, data, viewport);

  ctx.restore();

  if (options.clipCircle) {
    drawCompassBezel(ctx, canvas.width, canvas.height);
  }
}

function drawHUDCrosshair(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 12;

  ctx.save();
  ctx.strokeStyle = 'rgba(117, 214, 255, 0.15)'; // soft info blue
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 4]); // Dashed lines

  // Concentric range circles
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair lines
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  ctx.restore();
}

function drawCompassBezel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius - 12;

  ctx.save();

  // Draw bezel background
  ctx.fillStyle = '#090d14';
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true); // counter-clockwise to cut a hole
  ctx.closePath();
  ctx.fill();

  // Draw bezel outer and inner stroke lines
  ctx.strokeStyle = 'rgba(255, 179, 92, 0.45)'; // Amber/copper border
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 179, 92, 0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius + 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Draw degree ticks
  ctx.strokeStyle = 'rgba(255, 179, 92, 0.3)';
  for (let angleDeg = 0; angleDeg < 360; angleDeg += 15) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const isMajor = angleDeg % 30 === 0;
    const tickLen = isMajor ? 5 : 3;

    const startX = cx + Math.cos(angleRad) * (outerRadius - 1);
    const startY = cy + Math.sin(angleRad) * (outerRadius - 1);
    const endX = cx + Math.cos(angleRad) * (outerRadius - 1 - tickLen);
    const endY = cy + Math.sin(angleRad) * (outerRadius - 1 - tickLen);

    ctx.lineWidth = isMajor ? 1 : 0.6;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw cardinal directions: N, E, S, W
  const fontName = "'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = '#ffb35c';
  ctx.font = `bold 8px ${fontName}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const directions = [
    { label: 'N', angle: -Math.PI / 2 },
    { label: 'E', angle: 0 },
    { label: 'S', angle: Math.PI / 2 },
    { label: 'W', angle: Math.PI }
  ];

  for (const d of directions) {
    // Position text slightly inwards from the tick mark
    const tx = cx + Math.cos(d.angle) * (outerRadius - 6);
    const ty = cy + Math.sin(d.angle) * (outerRadius - 6);
    ctx.fillText(d.label, tx, ty);
  }

  ctx.restore();
}

function getMapViewport(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  options: Pick<DrawMinimapOptions, 'fitToCanvas' | 'viewport'>
) {
  if (options.viewport) {
    const cell = Math.round(options.viewport.cell);
    return {
      left: Math.round(canvas.width / 2 - options.viewport.centerX * cell),
      top: Math.round(canvas.height / 2 - options.viewport.centerY * cell),
      width: Math.round(data.width * cell),
      height: Math.round(data.height * cell),
      cell
    };
  }

  if (!options.fitToCanvas) {
    const cell = Math.round(computeCellSize(data.width, data.height));
    return {
      left: 0,
      top: 0,
      width: Math.round(data.width * cell),
      height: Math.round(data.height * cell),
      cell
    };
  }

  const padding = 12;
  const usableWidth = Math.max(1, canvas.width - padding * 2);
  const usableHeight = Math.max(1, canvas.height - padding * 2);
  const cell = Math.max(
    1,
    Math.round(Math.min(usableWidth / data.width, usableHeight / data.height))
  );
  const width = Math.round(data.width * cell);
  const height = Math.round(data.height * cell);

  return {
    left: Math.round((canvas.width - width) / 2),
    top: Math.round((canvas.height - height) / 2),
    width,
    height,
    cell
  };
}

function drawTiles(
  ctx: CanvasRenderingContext2D,
  data: MinimapData,
  viewport: ReturnType<typeof getMapViewport>
) {
  if (data.passable.length === 0) {
    ctx.fillStyle = '#0e141f';
    ctx.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);
    return;
  }

  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const pass = data.passable[y]?.[x] ?? false;
      // High tech blue-teal palette
      ctx.fillStyle = pass ? '#111b27' : '#06080c';
      ctx.fillRect(
        viewport.left + x * viewport.cell,
        viewport.top + y * viewport.cell,
        viewport.cell,
        viewport.cell
      );

      if (viewport.cell >= 4) {
        ctx.strokeStyle = pass ? 'rgba(117, 214, 255, 0.07)' : 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(
          viewport.left + x * viewport.cell + 0.5,
          viewport.top + y * viewport.cell + 0.5,
          viewport.cell - 1,
          viewport.cell - 1
        );
      }
    }
  }
}

function drawHoveredTile(
  ctx: CanvasRenderingContext2D,
  viewport: ReturnType<typeof getMapViewport>,
  hoveredTile: { x: number; y: number } | null
) {
  if (!hoveredTile) return;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 179, 92, 0.16)';
  ctx.fillRect(
    Math.round(viewport.left + hoveredTile.x * viewport.cell),
    Math.round(viewport.top + hoveredTile.y * viewport.cell),
    viewport.cell,
    viewport.cell
  );
  ctx.strokeStyle = 'rgba(255, 179, 92, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(
    Math.round(viewport.left + hoveredTile.x * viewport.cell) + 0.5,
    Math.round(viewport.top + hoveredTile.y * viewport.cell) + 0.5,
    viewport.cell - 1,
    viewport.cell - 1
  );
  ctx.restore();
}

function drawEvents(
  ctx: CanvasRenderingContext2D,
  data: MinimapData,
  viewport: ReturnType<typeof getMapViewport>
) {
  for (const ev of data.events) {
    const ex = Math.round(viewport.left + ev.x * viewport.cell + viewport.cell / 2);
    const ey = Math.round(viewport.top + ev.y * viewport.cell + viewport.cell / 2);
    const color = TRIGGER_COLORS[ev.trigger] ?? '#e2e8f0';
    // Subtract 1.0 from half-cell size to guarantee a 1px border padding buffer so circles do not get clipped/cropped
    const r = Math.max(1.5, Math.floor(viewport.cell / 2 - 1.0));

    // Event Glyph Center (simple solid circle with thin border)
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  data: MinimapData,
  viewport: ReturnType<typeof getMapViewport>
) {
  const px = Math.round(viewport.left + data.playerX * viewport.cell + viewport.cell / 2);
  const py = Math.round(viewport.top + data.playerY * viewport.cell + viewport.cell / 2);
  const pr = Math.max(4, Math.floor(viewport.cell / 2));

  // Dynamic pulsing values for player indicators (using 1200ms cycle)
  const pulseSpeed = 1200; 
  const pulse = Math.sin((Date.now() % pulseSpeed) / pulseSpeed * Math.PI * 2);
  const pointerAlpha = 0.70 + pulse * 0.30; // oscillates between 0.40 and 1.00

  // 1. Calculate direction angle
  let angle = Math.PI / 2; // Down (2)
  if (data.playerDir === 4) angle = Math.PI; // Left
  else if (data.playerDir === 6) angle = 0; // Right
  else if (data.playerDir === 8) angle = 3 * Math.PI / 2; // Up

  // 2. Draw FOV Cone (pulsating opacity/intensity)
  ctx.save();
  const coneRadius = viewport.cell * 4.5;
  const coneAngle = Math.PI / 3.5; // ~51 degrees wedge
  
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, coneRadius, angle - coneAngle / 2, angle + coneAngle / 2);
  ctx.closePath();
  
  const fovAlphaBase = 0.22 + pulse * 0.05; // 0.17 to 0.27
  const fovAlphaMid = 0.08 + pulse * 0.02; // 0.06 to 0.10
  
  const fovGrad = ctx.createRadialGradient(px, py, pr, px, py, coneRadius);
  fovGrad.addColorStop(0, `rgba(255, 179, 92, ${fovAlphaBase})`);
  fovGrad.addColorStop(0.3, `rgba(255, 179, 92, ${fovAlphaMid})`);
  fovGrad.addColorStop(1, 'rgba(255, 179, 92, 0)');
  ctx.fillStyle = fovGrad;
  ctx.fill();
  ctx.restore();

  // 3. White Direction Arrow/Triangle (with crisp border, pulsing opacity)
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.globalAlpha = pointerAlpha;
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c7834b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  // Points along positive x-axis (right, which matches rotated angle)
  ctx.moveTo(pr * 1.1, 0);
  ctx.lineTo(-pr * 0.7, -pr * 0.65);
  ctx.lineTo(-pr * 0.35, 0);
  ctx.lineTo(-pr * 0.7, pr * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
