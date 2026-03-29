// components/WeatherWidget.tsx
import React, { useState } from 'react';
import { WeatherData } from '../types';
import './WeatherWidget.css';

interface Props {
  weather: WeatherData | null;
  loading?: boolean;
}

function getWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('snow')) return '❄️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('clear')) return '☀️';
  if (c.includes('cold') || c.includes('freez') || c.includes('bitter')) return '🥶';
  return '🌡️';
}

export default function WeatherWidget({ weather, loading }: Props) {
  const [isCelsius, setIsCelsius] = useState(false);

  if (loading) {
    return (
      <div className="weather-widget card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px' }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Fetching Buffalo weather…</span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const temp = isCelsius ? weather.temperature_c : weather.temperature_f;
  const unit = isCelsius ? 'C' : 'F';

  return (
    <div className="weather-widget card">
      <div className="weather-widget__inner">
        <div className="weather-widget__left">
          <div className="weather-widget__location">
            Buffalo, NY • {weather.condition}
          </div>
          <div className="weather-widget__temp-row">
            <div className="weather-widget__temp">
              <span className="weather-widget__temp-num">{Math.round(temp)}°</span>
              <span className="weather-widget__temp-unit">{unit}</span>
            </div>
            <div className="weather-unit-selector">
              <button className={!isCelsius ? 'active' : ''} onClick={() => setIsCelsius(false)}>°F</button>
              <button className={isCelsius ? 'active' : ''} onClick={() => setIsCelsius(true)}>°C</button>
            </div>
          </div>
          <div className="weather-widget__precip">
            💧 {weather.precipitation_probability}% precipitation chance
          </div>
        </div>

        {/* Decorative right panel */}
        <div className="weather-widget__right">
          <div className="weather-widget__bg-text">
            {getWeatherEmoji(weather.condition)}
          </div>
        </div>
      </div>
    </div>
  );
}
