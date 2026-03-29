// pages/LaundryPage.tsx
// Dedicated laundry view: drag between Washer → Dryer → Closet with dryer settings
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';

import { fetchClothes, moveItem, updateClothingItem } from '../api/clothes';
import { ClothingItem, Location } from '../types';
import ClothingCard from '../components/ClothingCard';
import DroppableZone from '../components/DroppableZone';
import DryingRefBar from '../components/DryingRefBar';
import './LaundryPage.css';

export default function LaundryPage() {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: clothes = [], isLoading } = useQuery({ queryKey: ['clothes'], queryFn: fetchClothes });
  const [dragActive, setDragActive] = useState<ClothingItem | null>(null);

  const moveMut = useMutation({
    mutationFn: ({ id, location }: { id: number; location: Location }) => moveItem(id, location),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ClothingItem> }) => updateClothingItem(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragActive(null);
    const { active, over } = event;
    if (!over) return;

    const id = parseInt(String(active.id).replace('item-', ''));
    const loc = over.id as Location;

    if (['closet', 'washer', 'dryer'].includes(loc)) {
      const item = clothes.find(c => c.id === id);
      if (item && item.location !== loc) {
        moveMut.mutate({ id, location: loc });
      }
    }
  }, [clothes, moveMut]);

  const washerItems = clothes.filter(c => c.location === 'washer');
  const dryerItems  = clothes.filter(c => c.location === 'dryer');
  const closetItems = clothes.filter(c => c.location === 'closet');

  const getDryProgress = (item: ClothingItem): number => {
    if (!item.drying_started_at) return 0;
    // Approximate: synthetic high=25, cotton high=40, wool low=90
    const durations: Record<string, Record<string, number>> = {
      cotton: { high: 40, medium: 60, low: 80 },
      wool: { high: 70, medium: 90, low: 90 },
      synthetic: { high: 25, medium: 35, low: 50 },
    };
    const total = durations[item.fabric]?.[item.dryer_setting] ?? 60;
    const elapsed = (Date.now() - new Date(item.drying_started_at).getTime()) / 60000;
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => setDragActive(clothes.find(c => `item-${c.id}` === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
    >
      <div className="main-content">
        <div className="laundry-header">
          <h1 className="closet-page-title">🧺 Laundry</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Drag items between zones. Closet → Washer → Dryer → Closet
          </p>
        </div>

        {/* Flow diagram */}
        <div className="laundry-flow">
          <div className="flow-step flow-step--closet">👗 Closet</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step flow-step--washer">🫧 Washer</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step flow-step--dryer">🌀 Dryer</div>
          <div className="flow-arrow">→</div>
          <div className="flow-step flow-step--closet">👗 Closet</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="laundry-zones">

            {/* Washer zone */}
            <div className="card laundry-zone">
              <div className="card-header">
                <span className="section-title">🫧 Washer</span>
                <span className="badge badge-blue">{washerItems.length} items</span>
              </div>
              <DroppableZone id="washer" className="panel-grid">
                {washerItems.length === 0 ? (
                  <div className="panel-empty">Drag dirty clothes here</div>
                ) : washerItems.map(item => (
                  <ClothingCard key={item.id} item={item} />
                ))}
              </DroppableZone>
            </div>

            {/* Dryer zone — shows progress bars */}
            <div className="card laundry-zone">
              <div className="card-header">
                <span className="section-title">🌀 Dryer</span>
                <span className="badge badge-amber">{dryerItems.length} items</span>
              </div>
              <DroppableZone id="dryer" className="dryer-list">
                {dryerItems.length === 0 ? (
                  <div className="panel-empty" style={{ minHeight: 120 }}>Drag from washer to start drying</div>
                ) : dryerItems.map(item => {
                  const progress = getDryProgress(item);
                  const isDry = progress >= 100;
                  return (
                    <div key={item.id} className="dryer-item-row">
                      <ClothingCard item={item} />
                      <div className="dryer-item-details">
                        <div className="dryer-progress-label">
                          <span>{item.name}</span>
                          <span>{isDry ? '✅ Done!' : `${progress}%`}</span>
                        </div>
                        <div className="dryer-progress-track">
                          <div
                            className={`dryer-progress-fill ${isDry ? 'dryer-progress-fill--done' : ''}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Dryer setting controls */}
                        <div className="dryer-setting-row">
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Heat:</span>
                          {['high', 'medium', 'low'].map(s => (
                            <button
                              key={s}
                              className={`dryer-setting-btn ${item.dryer_setting === s ? 'dryer-setting-btn--active' : ''}`}
                              onClick={() => updateMut.mutate({ id: item.id, updates: { dryer_setting: s as any } })}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </DroppableZone>
            </div>

            {/* Closet zone */}
            <div className="card laundry-zone">
              <div className="card-header">
                <span className="section-title">👗 Closet (Clean)</span>
                <span className="badge badge-green">{closetItems.length} items</span>
              </div>
              <DroppableZone id="closet" className="panel-grid">
                {closetItems.length === 0 ? (
                  <div className="panel-empty">Dry items end up here</div>
                ) : closetItems.slice(0, 9).map(item => (
                  <ClothingCard key={item.id} item={item} />
                ))}
                {closetItems.length > 9 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>
                    +{closetItems.length - 9} more in closet
                  </div>
                )}
              </DroppableZone>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--sp-4)' }}><DryingRefBar /></div>
      </div>

      <DragOverlay>
        {dragActive && <ClothingCard item={dragActive} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
