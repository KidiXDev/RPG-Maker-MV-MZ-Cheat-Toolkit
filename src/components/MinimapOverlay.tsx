import { useEffect, useRef } from 'react';
import { getMinimapData, type MinimapData } from '../game/cheats/minimap.ts';
import {
  drawMinimap,
  getCanvasTile,
  type MinimapViewport
} from '../game/cheats/minimapRender.ts';
import { teleportTo } from '../game/cheats/teleport.ts';
import { useCheatStore } from '../store/useCheatStore.ts';

const OVERLAY_SIZE = 176;
const EDGE_PADDING = 10;
const DRAG_CLICK_THRESHOLD = 5;
const MINIMAP_CELL_SIZE = 8;

function clampOverlayPosition(x: number, y: number) {
  return {
    x: Math.max(
      EDGE_PADDING,
      Math.min(x, window.innerWidth - OVERLAY_SIZE - EDGE_PADDING)
    ),
    y: Math.max(
      EDGE_PADDING,
      Math.min(y, window.innerHeight - OVERLAY_SIZE - EDGE_PADDING)
    )
  };
}

function clampViewportCenter(
  data: MinimapData,
  centerX: number,
  centerY: number
): MinimapViewport {
  const halfVisibleTiles = OVERLAY_SIZE / 2 / MINIMAP_CELL_SIZE;

  function clampAxis(size: number, value: number) {
    if (size <= halfVisibleTiles * 2) return size / 2;
    return Math.max(halfVisibleTiles, Math.min(value, size - halfVisibleTiles));
  }

  return {
    centerX: clampAxis(data.width, centerX),
    centerY: clampAxis(data.height, centerY),
    cell: MINIMAP_CELL_SIZE
  };
}

function stopGameMouseEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

/**
 * Body-level minimap so it can sit above the game canvas and remain interactive
 * outside the shadow-root pass-through layer.
 */
export function MinimapOverlay() {
  const enabled = useCheatStore((state) => state.minimapOverlayEnabled);
  const opacity = useCheatStore((state) => state.minimapOverlayOpacity);
  const x = useCheatStore((state) => state.minimapOverlayX);
  const y = useCheatStore((state) => state.minimapOverlayY);
  const setPosition = useCheatStore((state) => state.setMinimapOverlayPosition);
  const pushToast = useCheatStore((state) => state.pushToast);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const root = document.createElement('div');
    const canvas = document.createElement('canvas');
    const position = clampOverlayPosition(x, y);

    root.id = 'rmc-minimap-overlay';
    root.style.cssText = [
      'position:fixed',
      `left:${position.x}px`,
      `top:${position.y}px`,
      `width:${OVERLAY_SIZE}px`,
      `height:${OVERLAY_SIZE}px`,
      `opacity:${opacity}`,
      'z-index:2147483645',
      'pointer-events:auto',
      'cursor:grab',
      'border-radius:50%',
      'overflow:hidden',
      'background:rgba(10,14,20,0.9)',
      'border:2px solid rgba(255,179,92,0.75)',
      'box-shadow:0 14px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
      'user-select:none'
    ].join(';');

    canvas.width = OVERLAY_SIZE;
    canvas.height = OVERLAY_SIZE;
    canvas.style.cssText = [
      'display:block',
      'width:100%',
      'height:100%',
      'image-rendering:pixelated'
    ].join(';');

    root.appendChild(canvas);
    document.body.appendChild(root);

    let currentX = position.x;
    let currentY = position.y;
    let isDragging = false;
    let dragDistance = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let startLeft = currentX;
    let startTop = currentY;
    let viewport: MinimapViewport | null = null;

    function moveRoot(nextX: number, nextY: number) {
      const clamped = clampOverlayPosition(nextX, nextY);
      currentX = clamped.x;
      currentY = clamped.y;
      root.style.left = `${currentX}px`;
      root.style.top = `${currentY}px`;
    }

    function draw() {
      const data = getMinimapData();
      if (data && data.width > 0) {
        viewport = clampViewportCenter(
          data,
          data.playerX + 0.5,
          data.playerY + 0.5
        );
        drawMinimap(canvas, data, { clipCircle: true, viewport });
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#0a0e14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
          ctx.font = '600 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('No map', canvas.width / 2, canvas.height / 2);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function handleResize() {
      moveRoot(currentX, currentY);
      setPosition({ x: currentX, y: currentY });
    }

    function handleMouseMove(event: MouseEvent) {
      if (!isDragging) return;
      stopGameMouseEvent(event);
      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;
      dragDistance = Math.max(dragDistance, Math.abs(dx), Math.abs(dy));
      moveRoot(startLeft + dx, startTop + dy);
    }

    function handleMouseUp(event: MouseEvent) {
      if (!isDragging) return;
      stopGameMouseEvent(event);
      isDragging = false;
      root.style.cursor = 'grab';
      setPosition({ x: currentX, y: currentY });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.button !== 0) return;
      stopGameMouseEvent(event);
      isDragging = true;
      dragDistance = 0;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      startLeft = currentX;
      startTop = currentY;
      root.style.cursor = 'grabbing';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    function handleClick(event: MouseEvent) {
      stopGameMouseEvent(event);
      if (dragDistance > DRAG_CLICK_THRESHOLD || !viewport) {
        return;
      }
      const data = getMinimapData();
      if (!data) return;
      const tile = getCanvasTile(canvas, data, event.clientX, event.clientY, {
        viewport
      });
      if (!tile) return;
      teleportTo(data.mapId, tile.x, tile.y);
      pushToast(`Teleported to (${tile.x}, ${tile.y})`);
    }

    function handleDoubleClick(event: MouseEvent) {
      stopGameMouseEvent(event);
    }

    function handleContextMenu(event: MouseEvent) {
      stopGameMouseEvent(event);
    }

    root.addEventListener('mousedown', handleMouseDown);
    root.addEventListener('click', handleClick);
    root.addEventListener('dblclick', handleDoubleClick);
    root.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', handleResize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      root.removeEventListener('mousedown', handleMouseDown);
      root.removeEventListener('click', handleClick);
      root.removeEventListener('dblclick', handleDoubleClick);
      root.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      root.remove();
    };
  }, [enabled, opacity, pushToast, setPosition, x, y]);

  return null;
}
