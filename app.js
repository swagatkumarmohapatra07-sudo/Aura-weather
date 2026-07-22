const state = {
  coords: null, city: '', country: '', unit: 'c', speedUnit: 'km/h',
  weather: null, hourly: null, daily: null, aqi: null,
  favs: JSON.parse(localStorage.getItem('aura_favs') || '[]'),
  chart: null, chartMode: 'temp'
};

const WMO = {
  desc: {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Rime Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',56:'Freezing Drizzle',57:'Freezing Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Violent Showers',85:'Snow Showers',86:'Snow Showers',95:'Thunderstorm',96:'Thunderstorm Hail',99:'Thunderstorm Hail'},
  icon: {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌦️',56:'🌧️',57:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',71:'❄️',73:'❄️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'🌨️',95:'⛈️',96:'⛈️',99:'⛈️'}
};
const WMO_BG = {0:'sunny',1:'sunny',2:'sunny',3:'cloudy',45:'cloudy',48:'cloudy',51:'rain',53:'rain',55:'rain',56:'rain',57:'rain',61:'rain',63:'rain',65:'rain',66:'rain',67:'rain',71:'snow',73:'snow',75:'snow',77:'snow',80:'rain',81:'rain',82:'rain',85:'snow',86:'snow',95:'rain',96:'rain',99:'rain'};

const $ = id => document.getElementById(id);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); } };

function getWMO(code, isDay) {
  if (!isDay && code <= 2) return { desc: 'Clear Night', icon: '🌙', bg: 'night' };
  if (!isDay && code === 2) return { desc: 'Partly Cloudy Night', icon: '☁️', bg: 'night' };
  return { desc: WMO.desc[code] || 'Unknown', icon: WMO.icon[code] || '☀️', bg: WMO_BG[code] || 'cloudy' };
}

function setBg(code, isDay) {
  const bg = $('bgLayer');
  if (!isDay && code <= 2) { bg.className = 'bg-layer weather-night'; return; }
  const cls = WMO_BG[code] || 'cloudy';
  bg.className = 'bg-layer weather-' + cls;
}

function formatTime(d) {
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatHour(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en', { hour: 'numeric', hour12: true });
}

function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en', { weekday: 'short' });
}

function toF(c) { return c * 9/5 + 32; }
function toMph(kmh) { return kmh * 0.621371; }

function formatTemp(c, unit) {
  const v = unit === 'f' ? toF(c) : c;
  return `${Math.round(v)}°`;
}

function formatSpeed(kmh, unit) {
  const v = unit === 'f' ? toMph(kmh) : kmh;
  return `${v.toFixed(1)} ${unit === 'f' ? 'mph' : 'km/h'}`;
}

// Toast
function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// Geolocation
function detectLocation() {
  if (!navigator.geolocation) { fetchWeatherByCoords(28.61, 77.23, 'New Delhi', 'India'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => { fetchReverseGeo(pos.coords.latitude, pos.coords.longitude); },
    () => fetchWeatherByCoords(28.61, 77.23, 'New Delhi', 'India'),
    { timeout: 7000 }
  );
}

async function fetchReverseGeo(lat, lon) {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1&language=en&format=json`);
    if (r.ok) {
      const d = await r.json();
      if (d.results && d.results[0]) {
        fetchWeatherByCoords(lat, lon, d.results[0].name, d.results[0].country || '');
        return;
      }
    }
  } catch {}
  // Fallback: use BigDataCloud
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (r.ok) {
      const d = await r.json();
      fetchWeatherByCoords(lat, lon, d.city || d.locality || 'Unknown', d.countryName || '');
      return;
    }
  } catch {}
  fetchWeatherByCoords(lat, lon, `${lat.toFixed(2)}, ${lon.toFixed(2)}`, '');
}

// City Search
async function searchCity(query) {
  if (query.length < 2) { $('searchDropdown').classList.remove('open'); return; }
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    if (!r.ok) throw Error();
    const d = await r.json();
    const dd = $('searchDropdown'); dd.innerHTML = '';
    if (!d.results || !d.results.length) {
      dd.innerHTML = '<div class="sd-item" style="color:var(--muted)">No results</div>';
      dd.classList.add('open'); return;
    }
    d.results.forEach(loc => {
      const el = document.createElement('div'); el.className = 'sd-item';
      el.textContent = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ', ' + loc.country : ''}`;
      el.dataset.lat = loc.latitude; el.dataset.lon = loc.longitude;
      el.dataset.name = loc.name; el.dataset.country = loc.country || '';
      el.addEventListener('click', () => {
        fetchWeatherByCoords(+el.dataset.lat, +el.dataset.lon, el.dataset.name, el.dataset.country);
        $('searchInput').value = el.dataset.name;
        dd.classList.remove('open');
      });
      dd.appendChild(el);
    });
    dd.classList.add('open');
  } catch { $('searchDropdown').innerHTML = '<div class="sd-item" style="color:var(--muted)">Error searching</div>'; }
}

// Main fetch
async function fetchWeatherByCoords(lat, lon, city, country) {
  state.coords = { lat, lon }; state.city = city; state.country = country;
  showSkeleton(true);

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index,relative_humidity_2m,apparent_temperature,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto`;

  try {
    const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
    if (!weatherRes.ok) throw Error('Weather fetch failed');
    const wd = await weatherRes.json();
    let aqiData = null;
    if (aqiRes.ok) aqiData = await aqiRes.json();

    state.weather = wd;
    state.aqi = aqiData;
    processWeatherData(wd);
    renderAll();
    showSkeleton(false);
  } catch (e) {
    console.error(e);
    $('skeleton').innerHTML = `<div class="glass" style="padding:32px;text-align:center;color:var(--muted)"><p>Failed to load weather data. Check your connection and try again.</p><button onclick="detectLocation()" style="margin-top:12px;padding:8px 20px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.06);color:var(--fg);cursor:pointer">Retry</button></div>`;
  }
}

function processWeatherData(wd) {
  const cu = wd.current;
  const h = wd.hourly;
  const d = wd.daily;

  state.current = {
    temp: cu.temperature_2m, feels: cu.apparent_temperature,
    humidity: cu.relative_humidity_2m, wind: cu.wind_speed_10m,
    windDir: cu.wind_direction_10m, pressure: cu.surface_pressure,
    uv: cu.uv_index, visibility: cu.visibility,
    code: cu.weather_code, isDay: cu.is_day || 1
  };

  state.hourly = h.time.map((t, i) => ({
    time: t, temp: h.temperature_2m[i], precip: h.precipitation_probability[i],
    code: h.weather_code[i], wind: h.wind_speed_10m[i],
    windDir: h.wind_direction_10m[i], uv: h.uv_index[i], humidity: h.relative_humidity_2m[i],
    feels: h.apparent_temperature[i], isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 18 ? 1 : 0
  }));

  state.daily = d.time.map((t, i) => ({
    time: t, tempMax: d.temperature_2m_max[i], tempMin: d.temperature_2m_min[i],
    code: d.weather_code[i], precip: d.precipitation_probability_max[i],
    sunrise: d.sunrise[i], sunset: d.sunset[i], uv: d.uv_index_max[i]
  }));

  if (state.aqi && state.aqi.current) {
    state.aqiData = {
      aqi: state.aqi.current.european_aqi,
      pm25: state.aqi.current.pm2_5, pm10: state.aqi.current.pm10,
      no2: state.aqi.current.nitrogen_dioxide, o3: state.aqi.current.ozone
    };
  }
}

function renderAll() {
  const cu = state.current, wmo = getWMO(cu.code, cu.isDay);
  setBg(cu.code, cu.isDay);

  // Hero
  $('heroCity').textContent = state.city + (state.country ? `, ${state.country}` : '');
  $('heroDate').textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('heroIcon').textContent = wmo.icon;
  $('heroTemp').textContent = formatTemp(cu.temp, state.unit);
  $('heroFeels').textContent = `Feels like ${formatTemp(cu.feels, state.unit)}`;
  $('heroCondition').textContent = wmo.desc;

  const hi = state.daily[0];
  if (hi) $('heroHiLo').textContent = `H:${formatTemp(hi.tempMax, state.unit)} L:${formatTemp(hi.tempMin, state.unit)}`;

  // AI Insight
  $('insightText').textContent = generateInsight(cu, wmo);

  // Quick stats
  $('qsWind').textContent = formatSpeed(cu.wind, state.unit);
  $('qsHumidity').textContent = `${cu.humidity}%`;
  $('qsUV').textContent = cu.uv.toFixed(1);
  $('qsRain').textContent = state.hourly.slice(0, 6).reduce((s, h) => s + h.precip, 0) / Math.min(6, state.hourly.length) + '%';

  // Metrics
  renderWind(cu);
  renderHumidity(cu);
  renderUV(cu);
  renderAQI();
  $('pressVal').textContent = cu.pressure?.toFixed(0) || '--';
  $('visVal').textContent = cu.visibility ? (cu.visibility / 1000).toFixed(1) : '--';
  renderSunriseSunset();

  // Hourly
  renderHourly();

  // Weekly
  renderWeekly();

  // Chart
  renderChart('temp');
}

function generateInsight(cu, wmo) {
  const parts = [];
  if (cu.precip > 30) parts.push('Rain likely — grab an umbrella');
  else if (cu.precip > 10) parts.push('Slight chance of rain');
  else parts.push('Dry conditions expected');

  if (cu.uv >= 8) parts.push('Extreme UV — limit sun exposure');
  else if (cu.uv >= 6) parts.push('High UV — wear sunscreen');
  else if (cu.uv >= 3) parts.push('Moderate UV');

  if (cu.wind > 30) parts.push('Strong winds — secure loose items');
  else if (cu.wind > 15) parts.push('Breezy conditions');

  if (cu.temp > 35) parts.push('Extreme heat — stay hydrated');
  else if (cu.temp < 5) parts.push('Very cold — dress warmly');
  else if (cu.temp < 15) parts.push('Cool — layer up');

  return parts.length ? parts.join('. ') + '.' : 'Pleasant weather ahead!';
}

// Wind
function renderWind(cu) {
  $('windSpeed').textContent = formatSpeed(cu.wind, state.unit);
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(cu.windDir / 22.5) % 16;
  $('windDir').textContent = dirs[idx];
  const needle = document.getElementById('compassNeedle');
  if (needle) needle.setAttribute('transform', `rotate(${cu.windDir},50,50)`);
}

// Humidity ring
function renderHumidity(cu) {
  const pct = cu.humidity || 0;
  const circ = 2 * Math.PI * 50;
  const offset = circ - (pct / 100) * circ;
  const ring = $('humidRing');
  if (ring) { ring.style.strokeDasharray = circ; ring.style.strokeDashoffset = offset; }
  $('humidPct').textContent = `${pct}%`;
}

// UV
function renderUV(cu) {
  const uv = cu.uv || 0;
  const label = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : 'Extreme';
  const cls = uv <= 2 ? 'uv-low' : uv <= 5 ? 'uv-mod' : uv <= 7 ? 'uv-high' : 'uv-ext';
  $('uvVal').textContent = uv.toFixed(1);
  $('uvVal').className = 'uv-val ' + cls;
  $('uvLabel').textContent = label;
  $('uvLabel').className = 'uv-label ' + cls;
  $('uvFill').style.width = `${Math.min(100, uv / 11 * 100)}%`;
  $('uvFill').style.background = uv <= 2 ? 'var(--uv-low)' : uv <= 5 ? 'var(--uv-mod)' : uv <= 7 ? 'var(--uv-high)' : 'var(--uv-ext)';
}

// AQI
function renderAQI() {
  if (!state.aqiData) { $('aqiVal').textContent = '--'; $('aqiLabel').textContent = 'N/A'; $('aqiPollutant').textContent = ''; return; }
  const a = state.aqiData.aqi;
  const label = a <= 20 ? 'Good' : a <= 40 ? 'Fair' : a <= 60 ? 'Moderate' : a <= 80 ? 'Poor' : a <= 100 ? 'Very Poor' : 'Extreme';
  $('aqiVal').textContent = a ?? '--';
  $('aqiLabel').textContent = label;
  const pollutant = state.aqiData;
  let primary = 'PM2.5';
  const vals = [
    { n: 'PM2.5', v: pollutant.pm25 }, { n: 'PM10', v: pollutant.pm10 },
    { n: 'NO\u00b2', v: pollutant.no2 }, { n: 'O\u2083', v: pollutant.o3 }
  ];
  let maxV = -1;
  vals.forEach(p => { if (p.v > maxV) { maxV = p.v; primary = p.n; } });
  $('aqiPollutant').textContent = `Primary: ${primary}`;
}

// Sunrise/Sunset
function renderSunriseSunset() {
  if (!state.daily || !state.daily[0]) return;
  const d = state.daily[0];
  $('sunriseVal').textContent = formatTime(new Date(d.sunrise));
  $('sunsetVal').textContent = formatTime(new Date(d.sunset));
  const sr = new Date(d.sunrise), ss = new Date(d.sunset);
  const dayLen = ss - sr;
  const now = Date.now();
  let progress = (now - sr) / dayLen;
  progress = Math.max(0, Math.min(1, progress));
  const dot = document.getElementById('sunDot');
  if (dot) {
    const x = 10 + progress * 180;
    const y = 55 - Math.sin(progress * Math.PI) * 40;
    dot.setAttribute('cx', x); dot.setAttribute('cy', y);
  }
}

// Hourly
function renderHourly() {
  const scroll = $('hourlyScroll'); scroll.innerHTML = '';
  const now = new Date();
  const startIdx = state.hourly.findIndex(h => new Date(h.time) >= now);
  const slice = state.hourly.slice(Math.max(0, startIdx), startIdx + 24);

  slice.forEach((h, i) => {
    const wmo = getWMO(h.code, h.isDay);
    const div = document.createElement('div'); div.className = 'hour-item' + (i === 0 ? ' now' : '');
    div.innerHTML = `
      <span class="hour-time">${i === 0 ? 'Now' : formatHour(h.time)}</span>
      <span class="hour-icon">${wmo.icon}</span>
      <span class="hour-temp">${formatTemp(h.temp, state.unit)}</span>
      <span class="hour-precip">${h.precip > 0 ? '💧' + h.precip + '%' : ''}</span>
    `;
    scroll.appendChild(div);
  });
}

// Weekly
function renderWeekly() {
  const list = $('weeklyList'); list.innerHTML = '';
  state.daily.forEach(d => {
    const wmo = getWMO(d.code, 1);
    const div = document.createElement('div'); div.className = 'week-item';
    const tMin = d.tempMin, tMax = d.tempMax;
    const range = tMax - tMin || 1;
    const barStart = 5, barEnd = 95;
    const leftPct = barStart + (tMin - (tMin - 2)) / ((tMax + 2) - (tMin - 2)) * (barEnd - barStart);
    const widthPct = (range / ((tMax + 2) - (tMin - 2))) * (barEnd - barStart);

    div.innerHTML = `
      <span class="week-day">${formatDay(d.time)}</span>
      <span class="week-icon">${wmo.icon}</span>
      <div>
        <div class="week-temps"><span>${formatTemp(d.tempMin, state.unit)}</span><span>${formatTemp(d.tempMax, state.unit)}</span></div>
        <div class="week-bar-wrap"><div class="week-bar" style="left:${leftPct}%;width:${Math.max(widthPct, 8)}%"></div></div>
        <div class="week-precip">${d.precip > 0 ? '💧' + d.precip + '%' : ''}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

// Chart
let chartInstance = null;

function renderChart(mode) {
  state.chartMode = mode;
  const labels = state.hourly.slice(0, 24).map(h => formatHour(h.time));
  let datasets = [];
  const unit = state.unit;

  if (mode === 'temp') {
    datasets = [
      { label: `Temperature (${unit === 'f' ? '°F' : '°C'})`, data: state.hourly.slice(0, 24).map(h => h.temp), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,.15)', fill: true, tension: .3, pointRadius: 3 },
      { label: `Feels Like (${unit === 'f' ? '°F' : '°C'})`, data: state.hourly.slice(0, 24).map(h => h.feels), borderColor: '#60a5fa', backgroundColor: 'transparent', borderDash: [5, 5], tension: .3, pointRadius: 2 }
    ];
  } else if (mode === 'rain') {
    datasets = [
      { label: 'Precipitation %', data: state.hourly.slice(0, 24).map(h => h.precip), borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,.2)', fill: true, tension: .3, pointRadius: 3 }
    ];
  } else {
    datasets = [
      { label: `Wind (${unit === 'f' ? 'mph' : 'km/h'})`, data: state.hourly.slice(0, 24).map(h => h.wind), borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,.15)', fill: true, tension: .3, pointRadius: 3 }
    ];
  }

  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById('mainChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line', data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', maxTicksLimit: 8, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.04)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.04)' } }
      }
    }
  });
}

// UI helpers
function showSkeleton(show) {
  $('skeleton').style.display = show ? 'flex' : 'none';
  $('content').style.display = show ? 'none' : 'block';
}

// Init
function init() {
  // Search
  const searchInput = $('searchInput');
  searchInput.addEventListener('input', debounce(() => searchCity(searchInput.value), 350));
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) $('searchDropdown').classList.remove('open'); });

  // GPS
  $('gpsBtn').addEventListener('click', detectLocation);

  // Unit toggle
  const toggles = document.querySelectorAll('.unit-opt');
  toggles.forEach(t => t.addEventListener('click', () => {
    toggles.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    state.unit = t.dataset.unit;
    if (state.weather) { processWeatherData(state.weather); renderAll(); }
  }));

  // Chart tabs
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (state.hourly) renderChart(tab.dataset.chart);
    });
  });

  // Favorites
  $('favBtn').addEventListener('click', () => { $('drawer').classList.add('open'); $('drawerOverlay').classList.add('open'); });
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerOverlay').addEventListener('click', closeDrawer);
  renderFavs();

  // Start
  detectLocation();
}

function closeDrawer() {
  $('drawer').classList.remove('open'); $('drawerOverlay').classList.remove('open');
}

function renderFavs() {
  const list = $('favList'); list.innerHTML = '';
  if (!state.favs.length) { $('drawerEmpty').style.display = 'block'; return; }
  $('drawerEmpty').style.display = 'none';
  state.favs.forEach((f, i) => {
    const div = document.createElement('div'); div.className = 'sd-item';
    div.textContent = f.name;
    div.addEventListener('click', () => { fetchWeatherByCoords(f.lat, f.lon, f.name, f.country); closeDrawer(); });
    list.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', init);
