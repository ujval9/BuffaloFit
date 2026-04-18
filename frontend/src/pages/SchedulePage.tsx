// pages/SchedulePage.tsx
// Class schedule CRUD — add, view, and delete class entries
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, deleteClass, updateClass } from '../api/classes';
import { ClassScheduleCreate } from '../types';
import './SchedulePage.css';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY_FORM: ClassScheduleCreate = {
  course_name: '',
  start_time: '',
  end_time: '',
  travel_minutes: 60,
  days_of_week: 'Monday, Wednesday, Friday',
};

export default function SchedulePage() {
  const qc = useQueryClient();
  const { data: classes = [], isLoading } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });

  const [form, setForm] = useState<ClassScheduleCreate>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClassId, setEditClassId] = useState<number | null>(null);

  const createMut = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: (err: any) => setError(err?.response?.data?.detail ?? 'Failed to add class.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ClassScheduleCreate }) => updateClass(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      setForm(EMPTY_FORM);
      setEditClassId(null);
      setShowForm(false);
    },
    onError: (err: any) => setError(err?.response?.data?.detail ?? 'Failed to update class.'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.course_name || !form.start_time || !form.end_time) {
      setError('Please fill in all fields.');
      return;
    }
    if (editClassId) {
      updateMut.mutate({ id: editClassId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  const extractTimeForInput = (iso: string) => {
    if (!iso) return '';
    try {
      const parts = iso.split('T');
      if (parts.length > 1) return parts[1].slice(0, 5);
      return '';
    } catch { return ''; }
  };

  const fakeDatePrefix = new Date().toISOString().split('T')[0];

  return (
    <div className="main-content">
      {/* Header */}
      <div className="schedule-header">
        <div>
          <h1 className="closet-page-title">📅 Class Schedule</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Your classes determine when you need to leave, which affects outfit timing.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm(EMPTY_FORM);
          setEditClassId(null);
          setShowForm(v => !v);
        }}>
          {showForm && !editClassId ? '✕ Cancel' : '+ Add Class'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card schedule-form-card">
          <div className="card-header">
            <span className="section-title">{editClassId ? 'Edit Class' : 'New Class'}</span>
          </div>
          <form className="schedule-form card-body" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="schedule-form-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Course Name</label>
                <input
                  className="form-input"
                  placeholder='e.g. "CSE 250 — Data Structures"'
                  value={form.course_name}
                  onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  className="form-input"
                  type="time"
                  value={extractTimeForInput(form.start_time)}
                  onChange={e => setForm(p => ({ ...p, start_time: `${fakeDatePrefix}T${e.target.value}:00` }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  className="form-input"
                  type="time"
                  value={extractTimeForInput(form.end_time)}
                  onChange={e => setForm(p => ({ ...p, end_time: `${fakeDatePrefix}T${e.target.value}:00` }))}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Days of Week</label>
                <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', marginTop: 4 }}>
                  {ALL_DAYS.map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(form.days_of_week || '').split(', ').includes(day)}
                        onChange={(e) => {
                          const current = (form.days_of_week || '').split(', ').filter(Boolean);
                          if (e.target.checked) {
                            setForm(p => ({ ...p, days_of_week: [...current, day].join(', ') }));
                          } else {
                            setForm(p => ({ ...p, days_of_week: current.filter(d => d !== day).join(', ') }));
                          }
                        }}
                      />
                      <span style={{ fontSize: 14 }}>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Travel Time (minutes)</label>
                <input
                  className="form-input"
                  type="number"
                  min={5} max={180}
                  value={form.travel_minutes}
                  onChange={e => setForm(p => ({ ...p, travel_minutes: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditClassId(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? 'Saving…' : (editClassId ? 'Save Changes' : 'Add Class')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Class list */}
      <div className="card" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="card-header">
          <span className="section-title">All Classes</span>
          <span className="badge badge-gray">{classes.length}</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No classes added yet. Click "Add Class" to get started.
          </div>
        ) : (
          <div className="schedule-list">
            {classes.map(cls => (
              <div key={cls.id} className="schedule-item">
                <div className="schedule-item__color" />
                <div className="schedule-item__info">
                  <div className="schedule-item__name">{cls.course_name}</div>
                  <div className="schedule-item__meta">
                    <span>⏰ {formatTime(cls.start_time)} → {formatTime(cls.end_time)}</span>
                    <span>🗓 {cls.days_of_week || 'No returning days'}</span>
                    <span>🚶 {cls.travel_minutes} min travel</span>
                  </div>
                </div>
                <div className="schedule-item__leave">
                  Leave by{' '}
                  <strong>
                    {formatTime(
                      new Date(
                        new Date(cls.start_time).getTime() - cls.travel_minutes * 60000
                      ).toISOString()
                    )}
                  </strong>
                </div>
                <button
                  className="btn-icon"
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  title="Edit class"
                  onClick={() => {
                    setForm({
                      course_name: cls.course_name,
                      start_time: cls.start_time.slice(0, 16),
                      end_time: cls.end_time.slice(0, 16),
                      travel_minutes: cls.travel_minutes,
                      days_of_week: cls.days_of_week
                    });
                    setEditClassId(cls.id);
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  ✏️
                </button>
                <button
                  className="btn-icon"
                  style={{ color: 'var(--danger)', flexShrink: 0 }}
                  title="Delete class"
                  onClick={() => {
                    if (window.confirm(`Delete "${cls.course_name}"?`)) deleteMut.mutate(cls.id);
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
