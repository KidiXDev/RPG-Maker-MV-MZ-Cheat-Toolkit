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
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (options.clipCircle) {
    const radius = Math.min(canvas.width, canvas.height) / 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);

  drawTiles(ctx, data, viewport);
  drawHoveredTile(ctx, viewport, options.hoveredTile ?? null);
  drawEvents(ctx, data, viewport);
  drawPlayer(ctx, data, viewport);

  ctx.restore();
}

function getMapViewport(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  options: Pick<DrawMinimapOptions, 'fitToCanvas' | 'viewport'>
) {
  if (options.viewport) {
    return {
      left: canvas.width / 2 - options.viewport.centerX * options.viewport.cell,
      top: canvas.height / 2 - options.viewport.centerY * options.viewport.cell,
      width: data.width * options.viewport.cell,
      height: data.height * options.viewport.cell,
      cell: options.viewport.cell
    };
  }

  if (!options.fitToCanvas) {
    const cell = computeCellSize(data.width, data.height);
    return {
      left: 0,
      top: 0,
      width: data.width * cell,
      height: data.height * cell,
      cell
    };
  }

  const padding = 10;
  const usableWidth = Math.max(1, canvas.width - padding * 2);
  const usableHeight = Math.max(1, canvas.height - padding * 2);
  const cell = Math.max(
    1,
    Math.min(usableWidth / data.width, usableHeight / data.height)
  );
  const width = data.width * cell;
  const height = data.height * cell;

  return {
    left: (canvas.width - width) / 2,
    top: (canvas.height - height) / 2,
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
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(viewport.left, viewport.top, viewport.width, viewport.height);
    return;
  }

  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const pass = data.passable[y]?.[x] ?? false;
      ctx.fillStyle = pass ? '#1e2d20' : '#151a22';
      ctx.fillRect(
        viewport.left + x * viewport.cell,
        viewport.top + y * viewport.cell,
        viewport.cell,
        viewport.cell
      );

      if (viewport.cell >= 4) {
        ctx.strokeStyle = pass ? '#243829' : '#1c2236';
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

  ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
  ctx.fillRect(
    viewport.left + hoveredTile.x * viewport.cell,
    viewport.top + hoveredTile.y * viewport.cell,
    viewport.cell,
    viewport.cell
  );
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    viewport.left + hoveredTile.x * viewport.cell + 0.5,
    viewport.top + hoveredTile.y * viewport.cell + 0.5,
    viewport.cell - 1,
    viewport.cell - 1
  );
}

function drawEvents(
  ctx: CanvasRenderingContext2D,
  data: MinimapData,
  viewport: ReturnType<typeof getMapViewport>
) {
  for (const ev of data.events) {
    const ex = viewport.left + ev.x * viewport.cell + viewport.cell / 2;
    const ey = viewport.top + ev.y * viewport.cell + viewport.cell / 2;
    const color = TRIGGER_COLORS[ev.trigger] ?? '#e2e8f0';
    const r = Math.max(2, viewport.cell / 2 - 1);

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
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  data: MinimapData,
  viewport: ReturnType<typeof getMapViewport>
) {
  const px = viewport.left + data.playerX * viewport.cell + viewport.cell / 2;
  const py = viewport.top + data.playerY * viewport.cell + viewport.cell / 2;
  const pr = Math.max(3, viewport.cell / 2);

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
