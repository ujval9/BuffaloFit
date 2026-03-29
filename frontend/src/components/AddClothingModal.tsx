// components/AddClothingModal.tsx
// Modal form to add a new clothing item
import React, { useState } from 'react';
import { ClothingItemCreate, Fabric, Category, Location, DryerSetting, ClothingItem } from '../types';
import './AddClothingModal.css';

interface Props {
  onClose: () => void;
  onSave: (item: ClothingItemCreate) => void;
  defaultLocation?: Location;
  existingItem?: ClothingItem | null;
}

const FABRICS: Fabric[] = ['cotton', 'wool', 'synthetic'];
const SETTINGS: DryerSetting[] = ['high', 'medium', 'low'];

const FABRIC_COLORS_PRESETS: Record<Fabric, string[]> = {
  cotton:    ['#4B9CD3', '#60A5FA', '#93C5FD', '#2563EB'],
  wool:      ['#D4A017', '#F59E0B', '#A16207', '#78350F'],
  synthetic: ['#9B59B6', '#8B5CF6', '#C084FC', '#6D28D9'],
};

const CLOTHING_OPTIONS = [
  { id: 'tshirt', label: 'T-Shirt', cat: 'base_layer' },
  { id: 'hoodie', label: 'Hoodie / Fleece / Sweater', cat: 'top' },
  { id: 'jacket', label: 'Jacket / Coat', cat: 'outer' },
  { id: 'jeans', label: 'Jeans / Track Pant', cat: 'bottom' },
  { id: 'thermal', label: 'Thermal', cat: 'base_layer' },
];

export default function AddClothingModal({ onClose, onSave, defaultLocation = 'closet', existingItem }: Props) {
  const [uiType, setUiType] = useState(() => {
    if (existingItem) {
      if (existingItem.category === 'bottom') return 'jeans';
      if (existingItem.category === 'outer') return 'jacket';
      if (existingItem.category === 'base_layer') return 'tshirt';
      return 'hoodie';
    }
    return 'tshirt';
  });

  const [form, setForm] = useState<ClothingItemCreate>(() => {
    if (existingItem) {
      return {
        name: existingItem.name,
        category: existingItem.category,
        fabric: existingItem.fabric,
        warmth_score: existingItem.warmth_score,
        color: existingItem.color,
        is_clean: existingItem.is_clean,
        is_wet: existingItem.is_wet,
        location: existingItem.location,
        dryer_setting: existingItem.dryer_setting,
      };
    }
    return {
      name: '',
      category: 'base_layer',
      fabric: 'cotton',
      warmth_score: 5,
      color: '#4B9CD3',
      is_clean: true,
      is_wet: false,
      location: defaultLocation,
      dryer_setting: 'medium',
    };
  });

  const set = (field: keyof ClothingItemCreate, val: any) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const handleFabricChange = (f: Fabric) => {
    set('fabric', f);
    set('color', FABRIC_COLORS_PRESETS[f][0]);
  };

  const handleUiTypeChange = (id: string) => {
    setUiType(id);
    const opt = CLOTHING_OPTIONS.find(o => o.id === id);
    if (opt) set('category', opt.cat as Category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{existingItem ? 'Edit Clothing Item' : 'Add Clothing Item'}</h3>
          <button className="btn-icon" onClick={onClose} type="button">✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input
              className="form-input"
              placeholder='e.g. "Black Jeans"'
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          {/* Clothing Type */}
          <div className="form-group">
            <label className="form-label">Clothing Type</label>
            <select
              className="form-select"
              value={uiType}
              onChange={e => handleUiTypeChange(e.target.value)}
            >
              <optgroup label="Top / Upper Body">
                <option value="tshirt">T-Shirt</option>
                <option value="hoodie">Hoodie / Fleece / Sweater</option>
                <option value="jacket">Jacket / Coat</option>
              </optgroup>
              <optgroup label="Bottom / Lower">
                <option value="jeans">Jeans / Track Pant</option>
                <option value="thermal">Thermal</option>
              </optgroup>
            </select>
          </div>

          {/* Fabric — with colored dot preview */}
          <div className="form-group">
            <label className="form-label">Fabric Type</label>
            <div className="fabric-picker">
              {FABRICS.map(f => (
                <button
                  key={f}
                  type="button"
                  className={`fabric-option ${form.fabric === f ? 'fabric-option--active' : ''}`}
                  onClick={() => handleFabricChange(f)}
                >
                  <span
                    className="fabric-dot"
                    style={{ background: FABRIC_COLORS_PRESETS[f][0] }}
                  />
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color dot picker */}
          <div className="form-group">
            <label className="form-label">Outfit Colour</label>
            <div className="color-picker">
              {FABRIC_COLORS_PRESETS[form.fabric].map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.color === c ? 'color-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="color-custom"
                title="Custom color"
              />
            </div>
          </div>

          {/* Warmth score */}
          <div className="form-group">
            <label className="form-label">Warmth Score: {form.warmth_score}/10</label>
            <input
              type="range" min={1} max={10}
              value={form.warmth_score}
              onChange={e => set('warmth_score', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>🌞 Light</span><span>🥶 Very Warm</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
              * Warmth score is used by the system to recommend alternative dry clothes if your selected outfit won't be ready in time for the current weather.
            </p>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Current Location</label>
            <select className="form-select" value={form.location} onChange={e => set('location', e.target.value)}>
              <option value="closet">Closet (Clean & Dry)</option>
              <option value="washer">Washer (Dirty / Wet)</option>
              <option value="dryer">Dryer (Drying)</option>
            </select>
          </div>

          {/* Dryer setting (only relevant for dryer/washer) */}
          {(form.location === 'dryer' || form.location === 'washer') && (
            <div className="form-group">
              <label className="form-label">Dryer Setting</label>
              <select className="form-select" value={form.dryer_setting} onChange={e => set('dryer_setting', e.target.value)}>
                {SETTINGS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} Heat</option>)}
              </select>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{existingItem ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
