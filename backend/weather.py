"""
weather.py
----------
Calls the free Open-Meteo API to get the weather forecast for Buffalo, NY.
No API key needed — Open-Meteo is free for non-commercial use.
Buffalo coordinates: lat=42.88, lon=-78.87
"""

import httpx
from datetime import datetime, timedelta


BUFFALO_LAT = 42.88
BUFFALO_LON = -78.87

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def _celsius_to_fahrenheit(c: float) -> float:
    return round(c * 9 / 5 + 32, 1)


def _get_condition(precip_prob: int, temp_c: float) -> str:
    """Simple human-readable condition string."""
    if precip_prob >= 70:
        if temp_c <= 0:
            return "Snowy"
        return "Rainy"
    elif precip_prob >= 40:
        return "Cloudy / Drizzle"
    elif temp_c <= -5:
        return "Bitter Cold"
    elif temp_c <= 0:
        return "Freezing"
    elif temp_c <= 5:
        return "Very Cold"
    elif temp_c <= 10:
        return "Cold"
    elif temp_c <= 18:
        return "Cool"
    else:
        return "Clear Skies"


def get_buffalo_forecast(target_dt: datetime | None = None) -> dict:
    """
    Fetches hourly weather for Buffalo around the given datetime.
    If target_dt is None, uses the current time.

    Returns a dict with:
      - temperature_f
      - temperature_c
      - precipitation_probability (0-100)
      - condition (human-readable string)
      - forecast_time (ISO string of the hour used)
    """
    if target_dt is None:
        target_dt = datetime.now()

    # Round to nearest hour for the API
    target_hour = target_dt.replace(minute=0, second=0, microsecond=0)

    # Request 24 hours starting from now so we can find the right slot
    start_date = datetime.now().strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "latitude": BUFFALO_LAT,
        "longitude": BUFFALO_LON,
        "hourly": "temperature_2m,precipitation_probability",
        "temperature_unit": "celsius",
        "start_date": start_date,
        "end_date": end_date,
        "timezone": "America/New_York",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
            data = response.json()

        times = data["hourly"]["time"]              # list of "YYYY-MM-DDTHH:00" strings
        temps = data["hourly"]["temperature_2m"]
        precips = data["hourly"]["precipitation_probability"]

        # Find the index closest to target_hour
        target_str = target_hour.strftime("%Y-%m-%dT%H:00")
        best_idx = 0
        for i, t in enumerate(times):
            if t == target_str:
                best_idx = i
                break
            # fallback: keep closest
            if abs(len(t) - len(target_str)) == 0:
                try:
                    diff = abs(
                        datetime.fromisoformat(t) - target_hour
                    ).total_seconds()
                    best_diff = abs(
                        datetime.fromisoformat(times[best_idx]) - target_hour
                    ).total_seconds()
                    if diff < best_diff:
                        best_idx = i
                except Exception:
                    pass

        temp_c = temps[best_idx]
        precip_prob = precips[best_idx] or 0

        return {
            "temperature_f": _celsius_to_fahrenheit(temp_c),
            "temperature_c": round(temp_c, 1),
            "precipitation_probability": precip_prob,
            "condition": _get_condition(precip_prob, temp_c),
            "forecast_time": times[best_idx],
        }

    except Exception as e:
        # Return a fallback if the API is unreachable
        return {
            "temperature_f": 35.0,
            "temperature_c": 1.7,
            "precipitation_probability": 20,
            "condition": "Offline Mode",
            "forecast_time": target_hour.isoformat(),
            "error": str(e),
        }


def suggest_layers(temperature_f: float, precip_probability: int) -> dict:
    """
    Suggests clothing layers based on temperature and rain chance.
    Returns base, mid, outer layer suggestions and warmth_score_needed.
    """
    layers = {}
    warmth_needed = 5  # default

    if temperature_f <= 20:
        layers["base"] = "Thermal Undershirt"
        layers["mid"] = "Heavy Sweater"
        layers["outer"] = "Puffer Jacket"
        warmth_needed = 9
    elif temperature_f <= 32:
        layers["base"] = "Thermal T-Shirt"
        layers["mid"] = "Blue Hoodie"
        layers["outer"] = "Puffer Jacket"
        warmth_needed = 8
    elif temperature_f <= 45:
        layers["base"] = "Long Sleeve Shirt"
        layers["mid"] = "Hoodie"
        layers["outer"] = "Winter Coat"
        warmth_needed = 6
    elif temperature_f <= 55:
        layers["base"] = "T-Shirt"
        layers["mid"] = "Light Hoodie"
        layers["outer"] = "Light Jacket"
        warmth_needed = 5
    else:
        layers["base"] = "T-Shirt"
        layers["mid"] = None
        layers["outer"] = "Light Cardigan" if precip_probability > 40 else None
        warmth_needed = 3

    if precip_probability >= 50:
        layers["note"] = "Rain likely — bring a waterproof outer layer"

    layers["warmth_score_needed"] = warmth_needed
    return layers
