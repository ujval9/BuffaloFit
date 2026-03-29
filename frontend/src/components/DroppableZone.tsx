// components/DroppableZone.tsx
// A droppable container that wraps any zone (Closet, Washer, Dryer)
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface Props {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export default function DroppableZone({ id, children, className }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isOver ? 'droppable--over' : ''}`}
      style={{
        outline: isOver ? '2px dashed #2563EB' : '2px dashed transparent',
        outlineOffset: '2px',
        borderRadius: '10px',
        transition: 'outline 150ms ease',
      }}
    >
      {children}
    </div>
  );
}
