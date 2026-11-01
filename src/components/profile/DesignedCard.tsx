import React, { useEffect, useRef, useState } from 'react';
import { CardDesign, Participant } from '../../types';
import { DesignElement } from './DesignElement';

export function DesignedCard({ design, participant, publicUrl }: { design: CardDesign; participant: Participant; publicUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const canvasWidth = design.canvas.width || 420;
  const canvasHeight = design.canvas.height || 680;
  return <div ref={container} style={{ width: '100%', aspectRatio: `${canvasWidth} / ${canvasHeight}` }}>
    <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight,
      transform: `scale(${width / canvasWidth})`, transformOrigin: 'top left', overflow: 'hidden',
      background: design.canvas.background, borderRadius: design.theme.borderRadius,
      border: `${design.theme.borderWidth || 0}px solid ${design.theme.borderColor || 'transparent'}` }}>
      {design.elements.map(el => <div key={el.id} data-design-element={el.id} style={{
        position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
        transform: `rotate(${el.rotation || 0}deg)`, opacity: el.opacity ?? 1, zIndex: el.style.zIndex ?? 1,
      }}><DesignElement element={el} participant={participant} design={design} publicUrl={publicUrl} interactive /></div>)}
    </div>
  </div>;
}
