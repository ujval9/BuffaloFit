// pages/DailyPage.tsx
// Main dashboard: weather, readiness check, closet + washer grids, drying ref bar
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { fetchClothes, moveItem } from '../api/clothes';
import { fetchClasses } from '../api/classes';
import { getRecommendation, getCurrentWeather } from '../api/recommendation';
import { ClothingItem, Location } from '../types';

import ReadinessCard from '../components/ReadinessCard';
import WeatherWidget from '../components/WeatherWidget';
import LayeringBadges from '../components/LayeringBadges';
import ClothingCard from '../components/ClothingCard';
import DroppableZone from '../components/DroppableZone';
import DryingRefBar from '../components/DryingRefBar';
import AddClothingModal from '../components/AddClothingModal';
import { createClothingItem } from '../api/clothes';

import './DailyPage.css';

export default function DailyPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Data
  const { data: clothes = [], isLoading: clothesLoading } = useQuery({
    queryKey: ['clothes'],
    queryFn: fetchClothes,
    refetchInterval: 30_000,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });

  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: getCurrentWeather,
    staleTime: 5 * 60_000,
  });

  // UI state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  const [dragActive, setDragActive] = useState<ClothingItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalLocation, setAddModalLocation] = useState<Location>('closet');

  // Mutations
  const moveMut = useMutation({
    mutationFn: ({ id, location }: { id: number; location: Location }) => moveItem(id, location),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const createMut = useMutation({
    mutationFn: createClothingItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clothes'] }); setShowAddModal(false); },
  });

  // Filtered item lists
  const closetItems = clothes.filter(c => c.location === 'closet');
  const washerItems = clothes.filter(c => c.location === 'washer');
  const dryerItems  = clothes.filter(c => c.location === 'dryer');

  // Toggle item selection
  const toggleSelect = (id: number) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setRecommendation(null);
  };

  // Run recommendation
  const checkOutfit = async () => {
    if (selectedItemIds.size === 0) { setRecError('Please select at least one item.'); return; }
    if (!selectedClassId) { setRecError('Please select a class.'); return; }
    setRecError('');
    setRecLoading(true);
    try {
      const result = await getRecommendation(Array.from(selectedItemIds), selectedClassId);
      setRecommendation(result);
    } catch (err: any) {
      setRecError(err?.response?.data?.detail ?? 'Failed to check outfit.');
    } finally {
      setRecLoading(false);
    }
  };

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = clothes.find(c => `item-${c.id}` === event.active.id);
    setDragActive(item ?? null);
  }, [clothes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragActive(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = parseInt(String(active.id).replace('item-', ''));
    const targetZone = over.id as Location;

    if (['closet', 'washer', 'dryer'].includes(targetZone)) {
      const item = clothes.find(c => c.id === itemId);
      if (item && item.location !== targetZone) {
        moveMut.mutate({ id: itemId, location: targetZone });
      }
    }
  }, [clothes, moveMut]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="main-content">

        {/* ── Readiness card ─────────────────────────────────── */}
        <ReadinessCard
          isReady={recommendation?.outfit_ready ?? null}
          message={recommendation?.status_message ?? ''}
          leaveAt={recommendation?.leave_at}
        />

        {/* ── Class + Check row ───────────────────────────────── */}
        <div className="daily-controls card">
          <div className="daily-controls__row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Select Class for Today</label>
              <select
                className="form-select"
                value={selectedClassId ?? ''}
                onChange={e => { setSelectedClassId(e.target.value ? parseInt(e.target.value) : null); setRecommendation(null); }}
              >
                <option value="">— choose a class —</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.course_name} @ {new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 'var(--sp-3)' }}>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/schedule')}
                style={{ height: 40 }}
              >
                + Add Class
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={checkOutfit}
                  disabled={recLoading || selectedItemIds.size === 0 || !selectedClassId}
                  style={{ minWidth: 160, height: 40 }}
                >
                  {recLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Checking…</> : '✓ Check My Outfit'}
                </button>
              </div>
            </div>
              {selectedItemIds.size > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                  {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          </div>

          {recError && <div className="auth-error" style={{ marginTop: 8, fontSize: 13 }}>{recError}</div>}

          {/* Selected items summary */}
          {selectedItemIds.size > 0 && (
            <div className="daily-selected-items">
              {Array.from(selectedItemIds).map(id => {
                const item = clothes.find(c => c.id === id);
                if (!item) return null;
                const readiness = recommendation?.items?.find((r: any) => r.item_id === id);
                return (
                  <div
                    key={id}
                    className={`daily-selected-chip ${readiness ? (readiness.is_ready ? 'chip--ready' : 'chip--not-ready') : ''}`}
                  >
                    <span className="fabric-dot" style={{ background: item.color }} />
                    {item.name}
                    {readiness && (
                      <span style={{ fontSize: 10, opacity: 0.8 }}>
                        {readiness.is_ready ? ' ✓' : ` · ${readiness.minutes_remaining}min left`}
                      </span>
                    )}
                    <button onClick={() => toggleSelect(id)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 11 }}>✕</button>
                  </div>
                );
              })}
              {selectedItemIds.size > 0 && (
                <button
                  className="daily-selected-chip"
                  style={{ opacity: 0.5, cursor: 'pointer' }}
                  onClick={() => { setSelectedItemIds(new Set()); setRecommendation(null); }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Weather + Layering row ──────────────────────────── */}
        <div className="daily-weather-row">
          <div style={{ flex: 1 }}>
            <WeatherWidget weather={weather ?? null} loading={weatherLoading} />
          </div>
          <div style={{ flex: 1 }}>
            <LayeringBadges layering={recommendation?.layering ?? null} />
          </div>
        </div>

        {/* ── Alternatives if outfit not ready ─────────────────── */}
        {recommendation && !recommendation.outfit_ready && recommendation.alternatives.length > 0 && (
          <div className="alert alert-warning" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>⚠ MIXED LOAD DETECTED</strong>
              <span className="btn btn-danger" style={{ cursor: 'default', fontSize: 12 }}>ACTION REQUIRED</span>
            </div>
            <div style={{ fontSize: 13 }}>{recommendation.status_message}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              <strong>Dry alternatives from your closet:</strong>{' '}
              {recommendation.alternatives.map((a: ClothingItem) => (
                <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                  <span className="fabric-dot" style={{ background: a.color }} />
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Closet + Washer + Dryer panels ───────────────────── */}
        <div className="daily-panels">

          {/* Closet */}
          <div className="card panel">
            <div className="card-header">
              <span className="section-title">👗 Closet</span>
              <button className="btn-icon" title="Add item" onClick={() => { setAddModalLocation('closet'); setShowAddModal(true); }}>+</button>
            </div>
            <DroppableZone id="closet" className="panel-grid">
              {clothesLoading ? (
                <div className="panel-empty"><div className="spinner" /></div>
              ) : closetItems.length === 0 ? (
                <div className="panel-empty">Drop items here or add new ones →</div>
              ) : (
                closetItems.map(item => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.has(item.id)}
                    onSelect={toggleSelect}
                  />
                ))
              )}
            </DroppableZone>
          </div>

          {/* Washer */}
          <div className="card panel">
            <div className="card-header">
              <span className="section-title">🫧 Washer</span>
              <button className="btn-icon" title="Add item" onClick={() => { setAddModalLocation('washer'); setShowAddModal(true); }}>+</button>
            </div>
            <DroppableZone id="washer" className="panel-grid">
              {washerItems.length === 0 ? (
                <div className="panel-empty">Drag dirty clothes here</div>
              ) : (
                washerItems.map(item => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.has(item.id)}
                    onSelect={toggleSelect}
                  />
                ))
              )}
            </DroppableZone>
          </div>

          {/* Dryer */}
          <div className="card panel">
            <div className="card-header">
              <span className="section-title">🌀 Dryer</span>
              <button className="btn-icon" title="Add item" onClick={() => { setAddModalLocation('dryer'); setShowAddModal(true); }}>+</button>
            </div>
            <DroppableZone id="dryer" className="panel-grid">
              {dryerItems.length === 0 ? (
                <div className="panel-empty">Drag from washer to start drying</div>
              ) : (
                dryerItems.map(item => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.has(item.id)}
                    onSelect={toggleSelect}
                  />
                ))
              )}
            </DroppableZone>
          </div>
        </div>

        {/* ── Drying reference bar ─────────────────────────────── */}
        <DryingRefBar />

      </div>

      {/* ── Drag overlay (ghost card while dragging) ───────────── */}
      <DragOverlay>
        {dragActive && <ClothingCard item={dragActive} isDragging />}
      </DragOverlay>

      {/* ── Add clothing modal ──────────────────────────────────── */}
      {showAddModal && (
        <AddClothingModal
          defaultLocation={addModalLocation}
          onClose={() => setShowAddModal(false)}
          onSave={item => createMut.mutate(item)}
        />
      )}
    </DndContext>
  );
}
