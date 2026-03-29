// components/ClothingCard.tsx
// A draggable card for a single clothing item — shows name + fabric color dot
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ClothingItem, FABRIC_COLORS } from '../types';
import './ClothingCard.css';

interface Props {
  item: ClothingItem;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (id: number) => void;
  onEdit?: (item: ClothingItem) => void;
}

const CategoryEmoji: Record<string, string> = {
  base_layer: '👕',
  top: '👔',
  bottom: '👖',
  outer: '🧥',
};

export default function ClothingCard({ item, isSelected, isDragging, onSelect, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999, opacity: 0.85 }
    : undefined;

  const dotColor = FABRIC_COLORS[item.fabric] ?? '#6B7280';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`clothing-card ${isSelected ? 'clothing-card--selected' : ''} ${isDragging ? 'clothing-card--dragging' : ''} ${item.is_wet ? 'clothing-card--wet' : ''}`}
      onClick={() => onSelect?.(item.id)}
      {...listeners}
      {...attributes}
    >
      {/* Color dot top-left corner */}
      <span
        className="clothing-card__dot"
        style={{ background: dotColor }}
        title={`Fabric: ${item.fabric}`}
      />

      {/* Selection checkmark */}
      {isSelected && (
        <span className="clothing-card__check">✓</span>
      )}

      {/* Item name */}
      <div className="clothing-card__emoji">{CategoryEmoji[item.category] ?? '👗'}</div>
      <div className="clothing-card__name">{item.name}</div>

      {/* Status badge */}
      {item.is_wet && (
        <div className="clothing-card__status clothing-card__status--wet">💧 Wet</div>
      )}
      {item.location === 'dryer' && (
        <div className="clothing-card__status clothing-card__status--drying">🔆 Drying</div>
      )}

      {/* Edit button (only when onEdit provided) */}
      {onEdit && (
        <button
          className="clothing-card__edit"
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          title="Edit"
        >
          ✎
        </button>
      )}
    </div>
  );
}
