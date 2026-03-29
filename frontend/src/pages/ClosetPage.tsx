// pages/ClosetPage.tsx
// Full closet management — add, edit, delete items; shows 3x3 grid view
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';

import { fetchClothes, createClothingItem, deleteClothingItem, moveItem, updateClothingItem } from '../api/clothes';
import { ClothingItem, Location, FABRIC_COLORS, CATEGORY_LABELS } from '../types';
import ClothingCard from '../components/ClothingCard';
import DroppableZone from '../components/DroppableZone';
import AddClothingModal from '../components/AddClothingModal';
import DryingRefBar from '../components/DryingRefBar';
import './ClosetPage.css';

export default function ClosetPage() {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: clothes = [], isLoading } = useQuery({ queryKey: ['clothes'], queryFn: fetchClothes });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [dragActive, setDragActive] = useState<ClothingItem | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const createMut = useMutation({
    mutationFn: createClothingItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clothes'] }); setShowAddModal(false); },
  });

  const deleteMut = useMutation({
    mutationFn: deleteClothingItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<ClothingItem> }) => updateClothingItem(id, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clothes'] }); setEditingItem(null); },
  });

  const moveMut = useMutation({
    mutationFn: ({ id, location }: { id: number; location: Location }) => moveItem(id, location),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clothes'] }),
  });

  const filtered = clothes.filter(c => {
    if (filterLocation !== 'all' && c.location !== filterLocation) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActive(null);
    const { active, over } = event;
    if (!over) return;
    const id = parseInt(String(active.id).replace('item-', ''));
    const loc = over.id as Location;
    if (['closet', 'washer', 'dryer'].includes(loc)) {
      const item = clothes.find(c => c.id === id);
      if (item && item.location !== loc) moveMut.mutate({ id, location: loc });
    }
  };

  // Group by location for the drag panels
  const byLocation = (loc: Location) => filtered.filter(c => c.location === loc);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => setDragActive(clothes.find(c => `item-${c.id}` === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
    >
      <div className="main-content">
        {/* Header */}
        <div className="closet-header">
          <div>
            <h1 className="closet-page-title">👗 My Closet</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {clothes.length} items total · Drag to move between zones
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowAddModal(true); }}>
            + Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="closet-filters card">
          <select className="form-select" style={{ flex: 1 }} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
            <option value="all">All Locations</option>
            <option value="closet">Closet</option>
            <option value="washer">Washer</option>
            <option value="dryer">Dryer</option>
          </select>
          <select className="form-select" style={{ flex: 1 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="base_layer">Base Layer</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="outer">Outer</option>
          </select>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            {/* 3-panel drag zones */}
            <div className="closet-panels">
              {(['closet', 'washer', 'dryer'] as Location[]).map(loc => (
                <div key={loc} className="card panel">
                  <div className="card-header">
                    <span className="section-title">
                      {loc === 'closet' ? '👗' : loc === 'washer' ? '🫧' : '🌀'}
                      {' '}{loc.charAt(0).toUpperCase() + loc.slice(1)}
                      <span className="badge badge-gray" style={{ marginLeft: 8 }}>{byLocation(loc).length}</span>
                    </span>
                  </div>
                  <DroppableZone id={loc} className="panel-grid">
                    {byLocation(loc).length === 0 ? (
                      <div className="panel-empty">Empty</div>
                    ) : (
                      byLocation(loc).map(item => (
                        <ClothingCard
                          key={item.id}
                          item={item}
                          onEdit={() => setEditingItem(item)}
                        />
                      ))
                    )}
                  </DroppableZone>
                </div>
              ))}
            </div>

            {/* Full table view */}
            <div className="card" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="card-header">
                <span className="section-title">All Items</span>
                <span className="badge badge-gray">{filtered.length}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="closet-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Fabric</th>
                      <th>Warmth</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="fabric-dot" style={{ background: item.color }} />
                            <strong>{item.name}</strong>
                          </div>
                        </td>
                        <td>{CATEGORY_LABELS[item.category]}</td>
                        <td>
                          <span className="badge badge-gray" style={{ gap: 5 }}>
                            <span className="fabric-dot" style={{ background: FABRIC_COLORS[item.fabric] }} />
                            {item.fabric}
                          </span>
                        </td>
                        <td>
                          <div className="warmth-bar">
                            <div
                              className="warmth-fill"
                              style={{ width: `${item.warmth_score * 10}%` }}
                            />
                            <span className="warmth-num">{item.warmth_score}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${item.location === 'closet' ? 'badge-green' : item.location === 'dryer' ? 'badge-amber' : 'badge-blue'}`}>
                            {item.location}
                          </span>
                        </td>
                        <td>
                          {item.is_wet ? (
                            <span className="badge badge-blue">💧 Wet</span>
                          ) : (
                            <span className="badge badge-green">✓ Dry</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--text-muted)' }}
                            title="Edit item"
                            onClick={() => setEditingItem(item)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Delete item"
                            onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) deleteMut.mutate(item.id); }}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
                    No items match your filters. Add some items!
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 'var(--sp-4)' }}><DryingRefBar /></div>
      </div>

      <DragOverlay>
        {dragActive && <ClothingCard item={dragActive} isDragging />}
      </DragOverlay>

      {(showAddModal || editingItem) && (
        <AddClothingModal
          existingItem={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSave={item => {
            if (editingItem) {
              updateMut.mutate({ id: editingItem.id, updates: item });
            } else {
              createMut.mutate(item);
            }
          }}
        />
      )}
    </DndContext>
  );
}
