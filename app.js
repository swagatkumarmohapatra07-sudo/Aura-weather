const state = {
  coords: null, city: '', country: '', unit: 'c',
  weather: null, hourly: null, daily: null, aqi: null,
  favs: JSON.parse(localStorage.getItem('aura_favs') || '[]'),
  chart: null, chartMode: 'temp',
  selectedActivity: 'running', alerts: null
};

const WMO = {
  desc: {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Rime Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',56:'Freezing Drizzle',57:'Freezing Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',66:'Freezing Rain',67:'Freezing Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Rain Showers',81:'Rain Showers',82:'Violent Showers',85:'Snow Showers',86:'Snow Showers',95:'Thunderstorm',96:'Thunderstorm Hail',99:'Thunderstorm Hail'},
  icon: {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌦️',56:'🌧️',57:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',71:'❄️',73:'❄️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'🌨️',95:'⛈️',96:'⛈️',99:'⛈️'}
};
const WMO_BG = {0:'sunny',1:'sunny',2:'sunny',3:'cloudy',45:'cloudy',48:'cloudy',51:'rain',53:'rain',55:'rain',56:'rain',57:'rain',61:'rain',63:'rain',65:'rain',66:'rain',67:'rain',71:'snow',73:'snow',75:'snow',77:'snow',80:'rain',81:'rain',82:'rain',85:'snow',86:'snow',95:'rain',96:'rain',99:'rain'};

const ACTIVITIES = {
  running:{name:'Running',icon:'🏃',weights:{temp:.35,precip:.25,uv:.15,wind:.15,humid:.1},ideals:{tempMin:10,tempMax:18,humidMax:60,windMax:15,uvMax:2},vetos:{tempMin:0,tempMax:32,precipMax:50,windMax:30,uvMax:8}},
  cycling:{name:'Cycling',icon:'🚴',weights:{temp:.25,precip:.3,uv:.1,wind:.25,humid:.1},ideals:{tempMin:12,tempMax:22,windMax:10,uvMax:3},vetos:{tempMin:3,tempMax:35,precipMax:40,windMax:25,uvMax:9}},
  photography:{name:'Photo',icon:'📷',weights:{temp:.1,precip:.3,uv:.15,wind:.1,clouds:.35},ideals:{tempMin:10,tempMax:24,cloudsMin:15,cloudsMax:50,windMax:15,uvMax:4},vetos:{tempMin:-5,tempMax:38,precipMax:30,windMax:35,uvMax:8}},
  stargazing:{name:'Star Gaze',icon:'🔭',weights:{temp:.15,precip:.3,clouds:.45,humid:.1},ideals:{tempMin:5,tempMax:20,cloudsMax:5},vetos:{precipMax:10,cloudsMax:20}}};

const ODISHA_CITIES = [
  {n:'Bhubaneswar',lat:20.2961,lon:85.8245},{n:'Cuttack',lat:20.4625,lon:85.8830},{n:'Rourkela',lat:22.2604,lon:84.8536},{n:'Berhampur',lat:19.3148,lon:84.7941},{n:'Sambalpur',lat:21.4669,lon:83.9812},{n:'Puri',lat:19.8132,lon:85.8318},{n:'Balasore',lat:21.4927,lon:86.9319},{n:'Bhadrak',lat:21.0573,lon:86.5155},{n:'Baripada',lat:21.9348,lon:86.7331},{n:'Jharsuguda',lat:21.8557,lon:84.0074},{n:'Jajpur',lat:20.8468,lon:86.3377},{n:'Kendrapara',lat:20.5015,lon:86.4288},{n:'Banki',lat:20.3789,lon:85.5285},{n:'Khordha',lat:20.1829,lon:85.6168},{n:'Nayagarh',lat:20.1285,lon:85.0987},{n:'Dhenkanal',lat:20.6586,lon:85.5969},{n:'Angul',lat:20.8449,lon:85.1528},{n:'Talcher',lat:20.9510,lon:85.2323},{n:'Paradeep',lat:20.3168,lon:86.6167},{n:'Jagatsinghpur',lat:20.2699,lon:86.1724},{n:'Kendrapara',lat:20.5015,lon:86.4288},{n:'Rayagada',lat:19.1696,lon:83.4161},{n:'Koraput',lat:18.8126,lon:82.7109},{n:'Malkangiri',lat:18.3453,lon:81.8942},{n:'Nabarangpur',lat:19.2337,lon:82.5566},{n:'Balangir',lat:20.7065,lon:83.4979},{n:'Bargarh',lat:21.3325,lon:83.6176},{n:'Deogarh',lat:21.5352,lon:84.7341},{n:'Keonjhar',lat:21.6333,lon:85.5833},{n:'Mayurbhanj',lat:21.9333,lon:86.7333},{n:'Sundargarh',lat:22.1167,lon:84.5333},{n:'Subarnapur',lat:20.8333,lon:83.9167},{n:'Ganjam',lat:19.3833,lon:85.0500},{n:'Gajapati',lat:18.8833,lon:84.2000},{n:'Kalahandi',lat:19.8833,lon:83.2000},{n:'Nuapada',lat:20.8167,lon:82.5333},{n:'Boudh',lat:20.8333,lon:84.3167},{n:'Kandhamal',lat:20.5000,lon:84.2333}];

const MOON_EMOJI = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];

function calcMoonPhase() {
  const d = new Date(); const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const jd = 367*y - Math.floor(7*(y+Math.floor((m+9)/12))/4) + Math.floor(275*m/9) + day + 1721013.5;
  const days = jd - 2451550.1; const phase = ((days / 29.53058867) % 1 + 1) % 1;
  const idx = Math.round(phase * 8) % 8; const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  return { phase: idx, emoji: MOON_EMOJI[idx], illum, age: Math.round(phase * 29.53) };
}

function calcActivityScores(hours, activityKey) {
  const cfg = ACTIVITIES[activityKey]; if (!cfg || !hours) return null;
  const windows = [];
  for (let i = 0; i < hours.length - 2; i++) {
    const block = hours.slice(i, i + 3); let score = 0; let veto = '';
    for (const h of block) {
      if (cfg.vetos.tempMin !== undefined && h.temp < cfg.vetos.tempMin) veto = 'Too cold';
      if (cfg.vetos.tempMax !== undefined && h.temp > cfg.vetos.tempMax) veto = 'Too hot';
      if (cfg.vetos.precipMax !== undefined && h.precip > cfg.vetos.precipMax) veto = 'Rain';
      if (cfg.vetos.windMax !== undefined && h.wind > cfg.vetos.windMax) veto = 'Windy';
      if (cfg.vetos.uvMax !== undefined && h.uv > cfg.vetos.uvMax) veto = 'High UV';
      if (cfg.vetos.cloudsMax !== undefined && (h.cloudCover ?? h.clouds) > cfg.vetos.cloudsMax) veto = 'Cloudy';
    }
    if (veto) { windows.push({score:0,veto,start:block[0].time}); continue; }
    let s = 0, w = 0;
    for (const h of block) {
      let ps = 0, pw = 0;
      if (cfg.weights.temp > 0) { const d = Math.abs(h.temp - (cfg.ideals.tempMin + cfg.ideals.tempMax) / 2); const r = (cfg.ideals.tempMax - cfg.ideals.tempMin) / 2 + 5; ps += (1 - Math.min(d / r, 1)) * 100 * cfg.weights.temp; pw += cfg.weights.temp; }
      if (cfg.weights.precip > 0) { ps += (1 - Math.min(h.precip / (cfg.vetos.precipMax || 50), 1)) * 100 * cfg.weights.precip; pw += cfg.weights.precip; }
      if (cfg.weights.uv > 0) { ps += (1 - Math.min(h.uv / (cfg.vetos.uvMax || 8), 1)) * 100 * cfg.weights.uv; pw += cfg.weights.uv; }
      if (cfg.weights.wind > 0) { ps += (1 - Math.min(h.wind / (cfg.vetos.windMax || 25), 1)) * 100 * cfg.weights.wind; pw += cfg.weights.wind; }
      if (cfg.weights.humid > 0) { const hd = Math.abs(h.humidity - 45) / 45; ps += (1 - Math.min(hd, 1)) * 100 * cfg.weights.humid; pw += cfg.weights.humid; }
      if (cfg.weights.clouds > 0) { ps += (1 - Math.min((h.cloudCover ?? h.clouds ?? 0) / 100, 1)) * 100 * cfg.weights.clouds; pw += cfg.weights.clouds; }
      s += pw ? ps / pw : 50;
    }
    windows.push({ score: Math.round(s / 3), start: block[0].time, temp: block.reduce((a, h) => a + h.temp, 0) / 3, wind: block.reduce((a, h) => a + h.wind, 0) / 3, precip: block.reduce((a, h) => a + h.precip, 0) / 3, uv: block.reduce((a, h) => a + h.uv, 0) / 3 });
  }
  windows.sort((a, b) => b.score - a.score || new Date(a.start) - new Date(b.start));
  return { all: windows, best: windows[0] };
}

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
  return new Date(iso).toLocaleTimeString('en', { hour: 'numeric', hour12: true });
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
  return `${Math.round(unit === 'f' ? toF(c) : c)}°`;
}

function formatSpeed(kmh, unit) {
  const v = unit === 'f' ? toMph(kmh) : kmh;
  return `${v.toFixed(1)} ${unit === 'f' ? 'mph' : 'km/h'}`;
}

function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ====== ANIMATED WEATHER OVERLAY ======
function initWeatherAnim(code, isDay) {
  const layer = $('animLayer'); layer.innerHTML = '';
  const bg = WMO_BG[code] || 'cloudy';
  if (bg === 'rain') {
    for (let i = 0; i < 40; i++) {
      const drop = document.createElement('div'); drop.className = 'anim-rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.height = (Math.random() * 12 + 8) + 'px';
      drop.style.animationDuration = (Math.random() * .3 + .6) + 's';
      drop.style.animationDelay = (Math.random() * 2) + 's';
      drop.style.opacity = Math.random() * .4 + .1;
      layer.appendChild(drop);
    }
  } else if (bg === 'snow') {
    for (let i = 0; i < 30; i++) {
      const flake = document.createElement('div'); flake.className = 'anim-snow-flake';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.width = flake.style.height = (Math.random() * 4 + 3) + 'px';
      flake.style.animationDuration = (Math.random() * 2 + 3) + 's';
      flake.style.animationDelay = (Math.random() * 5) + 's';
      flake.style.opacity = Math.random() * .5 + .2;
      layer.appendChild(flake);
    }
  }
}

// ====== GEOLOCATION ======
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

// ====== SEARCH ======
async function searchCity(query) {
  if (query.length < 2) { $('searchDropdown').classList.remove('open'); return; }
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=15&language=en&format=json`);
    if (!r.ok) throw Error();
    const d = await r.json();
    const dd = $('searchDropdown'); dd.innerHTML = '';
    if (!d.results || !d.results.length) {
      dd.innerHTML = '<div class="sd-item" style="color:var(--muted)">No results</div>';
      dd.classList.add('open'); return;
    }
    d.results.forEach(loc => {
      const el = document.createElement('div'); el.className = 'sd-item';
      el.innerHTML = `${loc.name}<span class="sd-sub">${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ', ' + loc.country : ''}${loc.country_code ? ' (' + loc.country_code + ')' : ''}</span>`;
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

// ====== MAIN FETCH ======
async function fetchWeatherByCoords(lat, lon, city, country) {
  state.coords = { lat, lon }; state.city = city; state.country = country;
  showLoading(true);

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,visibility,is_day&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto`;

  try {
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      const errText = await weatherRes.text().catch(() => '');
      throw new Error(`Weather API returned ${weatherRes.status}: ${errText}`);
    }
    const wd = await weatherRes.json();

    let aqiData = null;
    try {
      const aqiRes = await fetch(aqiUrl);
      if (aqiRes.ok) aqiData = await aqiRes.json();
    } catch (aqiErr) {
      console.warn('AQI fetch failed (non-fatal):', aqiErr);
    }

    state.weather = wd; state.aqi = aqiData;
    processWeatherData(wd);
    renderAll();
    showLoading(false);
  } catch (e) {
    console.error('Weather fetch error:', e);
    $('loadingWrap').innerHTML = `<div class="glass" style="padding:32px;text-align:center;color:var(--muted)"><p>⚠️ Failed to load weather data.</p><p style="font-size:12px;margin-top:6px;color:var(--muted)">${e.message}</p><button onclick="detectLocation()" style="margin-top:12px;padding:8px 20px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.06);color:var(--fg);cursor:pointer">Retry</button></div>`;
  }
}

function processWeatherData(wd) {
  const cu = wd.current; const h = wd.hourly; const d = wd.daily;
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
    feels: h.apparent_temperature[i], pressure: h.surface_pressure ? h.surface_pressure[i] : null,
    isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 18 ? 1 : 0
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

// ====== RENDER ALL ======
function renderAll() {
  const cu = state.current, wmo = getWMO(cu.code, cu.isDay);
  setBg(cu.code, cu.isDay);
  initWeatherAnim(cu.code, cu.isDay);

  $('heroCity').textContent = state.city + (state.country ? `, ${state.country}` : '');
  $('heroDate').textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('heroIcon').textContent = wmo.icon;
  $('heroTemp').textContent = formatTemp(cu.temp, state.unit);
  $('heroFeels').textContent = `Feels like ${formatTemp(cu.feels, state.unit)}`;
  $('heroCondition').textContent = wmo.desc;

  const hi = state.daily[0];
  if (hi) $('heroHiLo').textContent = `H:${formatTemp(hi.tempMax, state.unit)} L:${formatTemp(hi.tempMin, state.unit)}`;
  $('insightText').textContent = generateInsight(cu, wmo);

  $('qsWind').textContent = formatSpeed(cu.wind, state.unit);
  $('qsHumidity').textContent = `${cu.humidity}%`;
  $('qsUV').textContent = cu.uv.toFixed(1);
  $('qsRain').textContent = state.hourly.slice(0, 6).reduce((s, h) => s + h.precip, 0) / Math.min(6, state.hourly.length) + '%';

  renderWind(cu); renderHumidity(cu); renderUV(cu); renderAQI();
  renderPressure(cu); renderVisibility(cu); renderSunriseSunset(); renderMoon();
  renderHourly(); renderWeekly(); renderChart('temp');
  renderActivityPills(); renderActivityBest();
  renderOdishaChips();
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

// ====== WIND ======
function renderWind(cu) {
  $('windSpeed').textContent = formatSpeed(cu.wind, state.unit);
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  $('windDir').textContent = dirs[Math.round(cu.windDir / 22.5) % 16];
  const needle = document.getElementById('compassNeedle');
  if (needle) needle.setAttribute('transform', `rotate(${cu.windDir},50,50)`);
}

// ====== HUMIDITY ======
function renderHumidity(cu) {
  const pct = cu.humidity || 0, circ = 2 * Math.PI * 50;
  const ring = $('humidRing');
  if (ring) { ring.style.strokeDasharray = circ; ring.style.strokeDashoffset = circ - (pct / 100) * circ; }
  $('humidPct').textContent = `${pct}%`;
}

// ====== UV ======
function renderUV(cu) {
  const uv = cu.uv || 0;
  const label = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : 'Extreme';
  const cls = uv <= 2 ? 'uv-low' : uv <= 5 ? 'uv-mod' : uv <= 7 ? 'uv-high' : 'uv-ext';
  $('uvVal').textContent = uv.toFixed(1); $('uvVal').className = 'uv-val ' + cls;
  $('uvLabel').textContent = label; $('uvLabel').className = 'uv-label ' + cls;
  $('uvFill').style.width = `${Math.min(100, uv / 11 * 100)}%`;
  $('uvFill').style.background = uv <= 2 ? 'var(--uv-low)' : uv <= 5 ? 'var(--uv-mod)' : uv <= 7 ? 'var(--uv-high)' : 'var(--uv-ext)';
}

// ====== AQI ======
function renderAQI() {
  if (!state.aqiData) { $('aqiVal').textContent = '--'; $('aqiLabel').textContent = 'N/A'; $('aqiPollutant').textContent = ''; return; }
  const a = state.aqiData.aqi;
  $('aqiVal').textContent = a ?? '--';
  $('aqiLabel').textContent = a <= 20 ? 'Good' : a <= 40 ? 'Fair' : a <= 60 ? 'Moderate' : a <= 80 ? 'Poor' : a <= 100 ? 'Very Poor' : 'Extreme';
  const vals = [{n:'PM2.5',v:state.aqiData.pm25},{n:'PM10',v:state.aqiData.pm10},{n:'NO₂',v:state.aqiData.no2},{n:'O₃',v:state.aqiData.o3}];
  let primary = 'PM2.5', maxV = -1;
  vals.forEach(p => { if (p.v > maxV) { maxV = p.v; primary = p.n; } });
  $('aqiPollutant').textContent = `Primary: ${primary}`;
}

// ====== PRESSURE TREND ======
function renderPressure(cu) {
  $('pressVal').textContent = cu.pressure?.toFixed(0) || '--';
  const pressures = state.hourly.slice(0, 12).map(h => h.pressure).filter(p => p !== null);
  if (pressures.length < 2) { $('pressTrend').style.display = 'none'; return; }
  $('pressTrend').style.display = 'flex';
  const first = pressures[0], last = pressures[pressures.length - 1];
  const delta = (last - first).toFixed(1);
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const cls = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
  $('pressArrow').textContent = arrow; $('pressDelta').textContent = `${Math.abs(delta)} hPa`;
  $('pressTrend').className = 'press-trend ' + cls;

  // Sparkline
  const canvas = $('pressSpark'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const w = canvas.parentElement.clientWidth - 8, h = 32;
  canvas.width = w * 2; canvas.height = h * 2; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(2, 2); ctx.clearRect(0, 0, w, h);
  const min = Math.min(...pressures), max = Math.max(...pressures), range = max - min || 1;
  const pts = pressures.map((p, i) => ({ x: i / (pressures.length - 1) * w, y: h - (p - min) / range * (h - 4) - 2 }));
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = delta > 0 ? '#3b82f6' : delta < 0 ? '#ef4444' : '#94a3b8';
  ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = delta > 0 ? 'rgba(59,130,246,.1)' : delta < 0 ? 'rgba(239,68,68,.1)' : 'rgba(148,163,184,.1)';
  ctx.lineTo(pts[pts.length - 1].x, h); ctx.lineTo(pts[0].x, h); ctx.closePath(); ctx.fill();
}

// ====== VISIBILITY ======
function renderVisibility(cu) {
  $('visVal').textContent = cu.visibility ? (cu.visibility / 1000).toFixed(1) : '--';
}

// ====== SUNRISE/SUNSET ======
function renderSunriseSunset() {
  if (!state.daily || !state.daily[0]) return;
  const d = state.daily[0];
  $('sunriseVal').textContent = formatTime(new Date(d.sunrise));
  $('sunsetVal').textContent = formatTime(new Date(d.sunset));
  const sr = new Date(d.sunrise), ss = new Date(d.sunset);
  const progress = Math.max(0, Math.min(1, (Date.now() - sr) / (ss - sr)));
  const dot = document.getElementById('sunDot');
  if (dot) { dot.setAttribute('cx', 10 + progress * 180); dot.setAttribute('cy', 55 - Math.sin(progress * Math.PI) * 40); }
}

// ====== MOON ======
function renderMoon() {
  const m = calcMoonPhase();
  const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
  $('moonEmoji').textContent = m.emoji;
  $('moonInfo').textContent = `${names[m.phase]} — ${m.illum}%`;
  $('moonSub').textContent = `Age: ${m.age} days`;
}

// ====== HOURLY ======
function renderHourly() {
  const scroll = $('hourlyScroll'); scroll.innerHTML = '';
  const now = new Date();
  const startIdx = state.hourly.findIndex(h => new Date(h.time) >= now);
  const slice = state.hourly.slice(Math.max(0, startIdx), startIdx + 24);
  slice.forEach((h, i) => {
    const wmo = getWMO(h.code, h.isDay);
    const div = document.createElement('div'); div.className = 'hour-item' + (i === 0 ? ' now' : '');
    const pct = Math.min(h.precip, 100);
    const barColor = pct > 60 ? '#3b82f6' : pct > 30 ? '#60a5fa' : pct > 10 ? '#93c5fd' : 'transparent';
    div.innerHTML = `
      <span class="hour-time">${i === 0 ? 'Now' : formatHour(h.time)}</span>
      <span class="hour-icon">${wmo.icon}</span>
      <span class="hour-temp">${formatTemp(h.temp, state.unit)}</span>
      <span class="hour-precip">${h.precip > 0 ? '💧 ' + h.precip + '%' : ''}</span>
      <div class="hour-precip-bar"><div class="hour-precip-fill" style="width:${pct}%;background:${barColor}"></div></div>
    `;
    scroll.appendChild(div);
  });
}

// ====== WEEKLY ======
function renderWeekly() {
  const list = $('weeklyList'); list.innerHTML = '';
  state.daily.forEach(d => {
    const wmo = getWMO(d.code, 1);
    const div = document.createElement('div'); div.className = 'week-item';
    const tMin = d.tempMin, tMax = d.tempMax, range = tMax - tMin || 1;
    const pad = 2; const total = (tMax + pad) - (tMin - pad);
    const left = (tMin - (tMin - pad)) / total * 90 + 5;
    const width = range / total * 90;
    div.innerHTML = `
      <span class="week-day">${formatDay(d.time)}</span>
      <span class="week-icon">${wmo.icon}</span>
      <div>
        <div class="week-temps"><span>${formatTemp(d.tempMin, state.unit)}</span><span>${formatTemp(d.tempMax, state.unit)}</span></div>
        <div class="week-bar-wrap"><div class="week-bar" style="left:${left}%;width:${Math.max(width, 6)}%"></div></div>
        <div class="week-precip">${d.precip > 0 ? '💧 ' + d.precip + '%' : ''}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

// ====== CHART ======
let chartInstance = null;

function renderChart(mode) {
  state.chartMode = mode;
  const labels = state.hourly.slice(0, 24).map(h => formatHour(h.time));
  const unit = state.unit; let datasets = [];
  const slice = state.hourly.slice(0, 24);
  if (mode === 'temp') {
    datasets = [
      { label: `Temp (${unit === 'f' ? '°F' : '°C'})`, data: slice.map(h => h.temp), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,.15)', fill: true, tension: .3, pointRadius: 3 },
      { label: `Feels (${unit === 'f' ? '°F' : '°C'})`, data: slice.map(h => h.feels), borderColor: '#3b82f6', backgroundColor: 'transparent', borderDash: [5,5], tension: .3, pointRadius: 2 }
    ];
  } else if (mode === 'rain') {
    datasets = [{ label: 'Precip %', data: slice.map(h => h.precip), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.2)', fill: true, tension: .3, pointRadius: 3 }];
  } else if (mode === 'wind') {
    datasets = [{ label: `Wind (${unit === 'f' ? 'mph' : 'km/h'})`, data: slice.map(h => h.wind), borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,.15)', fill: true, tension: .3, pointRadius: 3 }];
  } else if (mode === 'humidity') {
    datasets = [{ label: 'Humidity %', data: slice.map(h => h.humidity), borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,.15)', fill: true, tension: .3, pointRadius: 3 }];
  } else if (mode === 'uv') {
    datasets = [{ label: 'UV Index', data: slice.map(h => h.uv), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.12)', fill: true, tension: .3, pointRadius: 3 }];
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

// ====== ACTIVITY SCORING ======
function renderActivityPills() {
  const container = $('activityPills'); container.innerHTML = '';
  Object.keys(ACTIVITIES).forEach(key => {
    const a = ACTIVITIES[key];
    const btn = document.createElement('button'); btn.className = 'activity-pill' + (key === state.selectedActivity ? ' active' : '');
    btn.innerHTML = `${a.icon} ${a.name}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.activity-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active'); state.selectedActivity = key;
      renderActivityBest();
    });
    container.appendChild(btn);
  });
}

function renderActivityBest() {
  const now = new Date();
  const startIdx = state.hourly.findIndex(h => new Date(h.time) >= now);
  const future = state.hourly.slice(Math.max(0, startIdx), startIdx + 24);
  const result = calcActivityScores(future, state.selectedActivity);
  const el = $('bestTimeResult'); const score = $('bstScore'); const label = $('bstLabel');
  const time = $('bstTime'); const meta = $('bstMeta');

  if (!result || !result.best || result.best.score === 0) {
    score.textContent = '--'; score.className = 'bst-score low';
    label.textContent = 'No good window found';
    time.textContent = 'Conditions unsuitable';
    meta.textContent = 'Try a different activity';
    return;
  }
  const b = result.best;
  const cls = b.score >= 70 ? 'high' : b.score >= 40 ? 'med' : 'low';
  score.textContent = b.score; score.className = 'bst-score ' + cls;
  label.textContent = 'Best window in next 24h';
  const hourStr = formatHour(b.start);
  const nextDay = new Date(b.start); nextDay.setDate(nextDay.getDate() + 1);
  const dateStr = b.start ? formatDay(b.start) : '';
  time.textContent = `${dateStr} at ${hourStr} (3-hour window)`;
  const parts = [];
  if (b.temp) parts.push(`${Math.round(b.temp)}°`);
  if (b.precip !== undefined) parts.push(`${Math.round(b.precip)}% rain`);
  if (b.wind) parts.push(`${Math.round(b.wind)} km/h wind`);
  meta.textContent = parts.join(' · ');
}

// ====== ODISHA QUICK-SELECT ======
function renderOdishaChips() {
  const strip = $('odishaStrip'); strip.innerHTML = '';
  ODISHA_CITIES.forEach(c => {
    const chip = document.createElement('span'); chip.className = 'odisha-chip';
    chip.innerHTML = `<span class="chip-icon">📍</span>${c.n}`;
    chip.addEventListener('click', () => fetchWeatherByCoords(c.lat, c.lon, c.n, 'India'));
    strip.appendChild(chip);
  });
}

// ====== UI HELPERS ======
function showLoading(show) {
  $('loadingWrap').style.display = show ? 'flex' : 'none';
  $('content').style.display = show ? 'none' : 'block';
}

// ====== SERVICE WORKER ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

// ====== INIT ======
function init() {
  const searchInput = $('searchInput');
  searchInput.addEventListener('input', debounce(() => searchCity(searchInput.value), 350));
  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) $('searchDropdown').classList.remove('open'); });
  $('gpsBtn').addEventListener('click', detectLocation);

  const toggles = document.querySelectorAll('.unit-opt');
  toggles.forEach(t => t.addEventListener('click', () => {
    toggles.forEach(x => x.classList.remove('active'));
    t.classList.add('active'); state.unit = t.dataset.unit;
    if (state.weather) { processWeatherData(state.weather); renderAll(); }
  }));

  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (state.hourly) renderChart(tab.dataset.chart);
    });
  });

  $('favBtn').addEventListener('click', () => { $('drawer').classList.add('open'); $('drawerOverlay').classList.add('open'); });
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerOverlay').addEventListener('click', closeDrawer);
  renderFavs();

  detectLocation();
}

function closeDrawer() { $('drawer').classList.remove('open'); $('drawerOverlay').classList.remove('open'); }

function renderFavs() {
  const list = $('favList'); list.innerHTML = '';
  if (!state.favs.length) { $('drawerEmpty').style.display = 'block'; return; }
  $('drawerEmpty').style.display = 'none';
  state.favs.forEach(f => {
    const div = document.createElement('div'); div.className = 'sd-item';
    div.textContent = f.name;
    div.addEventListener('click', () => { fetchWeatherByCoords(f.lat, f.lon, f.name, f.country); closeDrawer(); });
    list.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', init);
