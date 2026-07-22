# Aura Weather

A modern, full-featured weather web application with a frosted glassmorphism UI, dynamic weather-responsive backgrounds, interactive charts, and zero dependencies (apart from Chart.js via CDN). No build tools, no API keys required.

## Features

- **Live Weather Data** — Powered by the free [Open-Meteo API](https://open-meteo.com/) (no API key needed)
- **Current Conditions** — Temperature, "feels like", high/low, weather condition with WMO code mapping
- **AI Insight Box** — Dynamic smart summary based on weather parameters (UV, wind, rain, temperature)
- **Red & Blue Glassmorphism UI** — Dual-tone frosted glass cards with `backdrop-blur(24px)`, red-tinted and blue-tinted glass variants, gradient accents
- **Dynamic Backgrounds** — Background gradients that shift based on weather:
  - ☀️ Sunny — Warm golden hour tones
  - 🌧️ Rain — Deep charcoal with blue accents
  - ❄️ Snow — Cool cyan-gray
  - 🌙 Night — Midnight violet
  - ☁️ Cloudy — Muted slate
- **Animated Weather Loading** — Animated scene with rotating sun, drifting clouds, and falling rain while data loads
- **8 Metric Cards**
  - Wind Speed & Direction (animated compass needle)
  - Humidity (SVG progress ring)
  - UV Index (color-coded severity scale)
  - Air Quality Index (with primary pollutant readout)
  - Atmospheric Pressure (with trend sparkline and arrow indicator)
  - Visibility
  - Sunrise / Sunset arc visualization
  - Moon Phase (with illumination %, phase name, and age)
- **24-Hour Forecast** — Horizontal scrollable hourly slider with temp, precipitation chance, icons, and precipitation intensity bars
- **7-Day Forecast** — Vertical list with temperature range bars
- **Interactive Charts** — 5 toggleable modes: Temperature vs Feels Like, Precipitation %, Wind Speed, Humidity, UV Index (powered by Chart.js)
- **Activity Scoring Engine** — "Best Time To" feature: pick Running, Cycling, Photo, or Star Gaze and get the optimal 3-hour window in the next 24h with weather suitability score
- **Weather Animations** — Live animated rain streaks and snowfall particles overlay based on current weather code
- **Odisha Quick-Select** — One-tap buttons for 38+ cities, towns, and district headquarters across Odisha
- **City/Village Search** — Debounced autocomplete via Open-Meteo Geocoding API — covers every village, town, and city globally
- **GPS Geolocation** — Auto-detect location with reverse geocoding fallback
- **Unit Toggle** — °C / °F and km/h / mph
- **Saved Favorites** — Persisted in localStorage
- **PWA Offline Support** — Service worker caches app shell for offline access
- **Responsive** — Single-column on mobile, fluid multi-column on desktop

## Getting Started

1. Clone or download the repo
2. Open `index.html` in any modern browser
3. Allow location access or search for a city

No build step, no `npm install`, no server required.

## APIs Used

| API | Purpose |
|-----|---------|
| [Open-Meteo Weather API](https://open-meteo.com/) | Current weather, hourly & daily forecast |
| [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) | European AQI, PM2.5, PM10, NO₂, O₃ |
| [Open-Meteo Geocoding API](https://geocoding-api.open-meteo.com/) | City search and autocomplete |
| [BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/geocoding-apis/reverse-geocode-api) | Fallback for GPS location name resolution |

All APIs are free and require no API keys.

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Glassmorphism (`backdrop-filter: blur()`), CSS Grid, custom properties, animations
- **Vanilla JavaScript (ES6+)** — State management, DOM rendering, async/await API calls
- **Chart.js** — Interactive weather line charts (loaded via CDN)

## Project Structure

```
Aura-weather/
├── index.html    # Application shell with all component markup
├── style.css     # Full design system — glassmorphism, themes, responsive layout
├── app.js        # All logic — API handlers, state, rendering, chart management
└── README.md
```

## Features in Detail

### Glassmorphism Design System
Every card uses `background: rgba(15,23,42,.5)` with `backdrop-filter: blur(20px) saturate(1.4)` and `border: 1px solid rgba(255,255,255,.08)`, creating a translucent frosted-glass effect against the dynamic background.

### Dynamic Weather Backgrounds
The `<body>` background gradient is driven by WMO weather codes. Clear skies render a warm amber gradient, rain or storms render deep charcoal, snow renders cool cyan tones, and night renders violet-black.

### AI Insight Engine
The insight box generates human-readable summaries by evaluating temperature ranges, UV index thresholds, wind speeds, and precipitation probability — e.g. *"High UV — wear sunscreen. Breezy conditions. Cool — layer up."*

### WMO Weather Code Mapping
All 30+ WMO weather interpretation codes are mapped to icons, descriptions, and background themes, covering clear, cloudy, foggy, drizzly, rainy, snowy, and thunderstorm conditions.

## License

MIT
