// pages/OnboardingPage.tsx
// First-time setup: user adds their class schedule before using the app
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass } from '../api/classes';
import { completeOnboarding } from '../api/auth';
import { useAuth } from '../App';
import { ClassScheduleCreate } from '../types';
import './Onboarding.css';

const DAYS_OPTIONS = ['MWF', 'TR', 'MTWRF', 'MW', 'F', 'Sa'];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassScheduleCreate[]>([]);
  const [form, setForm] = useState<ClassScheduleCreate>({
    course_name: '',
    start_time: '',
    end_time: '',
    travel_minutes: 60,
    days_of_week: 'MWF',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_name || !form.start_time || !form.end_time) {
      setError('Please fill in course name and both times.');
      return;
    }
    setError('');
    setClasses(prev => [...prev, form]);
    setForm({ course_name: '', start_time: '', end_time: '', travel_minutes: 60, days_of_week: 'MWF' });
  };

  const removeFromList = (idx: number) =>
    setClasses(prev => prev.filter((_, i) => i !== idx));

  const handleFinish = async () => {
    if (classes.length === 0) {
      setError('Add at least one class to continue.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      for (const cls of classes) {
        await createClass(cls);
      }
      const updatedUser = await completeOnboarding(user.id);
      setUser(updatedUser);
      navigate('/');
    } catch (err: any) {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-emoji">📅</div>
          <h1>Set Up Your Classes</h1>
          <p>Add your class schedule so BuffaloFit knows when you need to leave. You can add more later.</p>
        </div>

        {/* Add class form */}
        <form className="onboarding-form" onSubmit={addToList}>
          {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="onboarding-form-grid">
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
                type="datetime-local"
                value={form.start_time}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.end_time}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Days</label>
              <select
                className="form-select"
                value={form.days_of_week}
                onChange={e => setForm(p => ({ ...p, days_of_week: e.target.value }))}
              >
                {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Travel Minutes</label>
              <input
                className="form-input"
                type="number"
                min={5} max={180}
                value={form.travel_minutes}
                onChange={e => setForm(p => ({ ...p, travel_minutes: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-ghost" style={{ width: '100%' }}>
            + Add Class to List
          </button>
        </form>

        {/* Class list preview */}
        {classes.length > 0 && (
          <div className="onboarding-class-list">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Classes to add ({classes.length})
            </h4>
            {classes.map((cls, i) => (
              <div key={i} className="onboarding-class-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.course_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {cls.days_of_week} · {new Date(cls.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(cls.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{cls.travel_minutes} min travel
                  </div>
                </div>
                <button className="btn-icon" onClick={() => removeFromList(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button
          className="auth-submit"
          onClick={handleFinish}
          disabled={loading || classes.length === 0}
          style={{ marginTop: 'var(--sp-5)' }}
        >
          {loading ? 'Saving…' : `Continue →  (${classes.length} class${classes.length !== 1 ? 'es' : ''})`}
        </button>
      </div>
    </div>
  );
}
