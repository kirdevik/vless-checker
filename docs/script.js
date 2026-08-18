const KEYS_URL = 'keys.json';
let data = null;
let updateInterval = null;
let map = null;
let favorites = JSON.parse(localStorage.getItem('favorites') || '{}');

// ВСЕ СТРАНЫ (ВКЛЮЧАЯ ТЕ, ЧТО БЫЛИ В OTHER)
const MODES = [
  {key:'baltics',label:'🇱🇹🇪🇪🇱🇻 Прибалтика',section:'vpn'},
  {key:'finland',label:'🇫🇮 Финляндия',section:'vpn'},
  {key:'sweden',label:'🇸🇪 Швеция',section:'vpn'},
  {key:'norway',label:'🇳🇴 Норвегия',section:'vpn'},
  {key:'denmark',label:'🇩🇰 Дания',section:'vpn'},
  {key:'germany',label:'🇩🇪 Германия',section:'vpn'},
  {key:'netherlands',label:'🇳🇱 Нидерланды',section:'vpn'},
  {key:'poland',label:'🇵🇱 Польша',section:'vpn'},
  {key:'uk',label:'🇬🇧 Великобритания',section:'vpn'},
  {key:'france',label:'🇫🇷 Франция',section:'vpn'},
  {key:'switzerland',label:'🇨🇭 Швейцария',section:'vpn'},
  {key:'italy',label:'🇮🇹 Италия',section:'vpn'},
  {key:'spain',label:'🇪🇸 Испания',section:'vpn'},
  {key:'usa',label:'🇺🇸 США',section:'vpn'},
  {key:'canada',label:'🇨🇦 Канада',section:'vpn'},
  {key:'mexico',label:'🇲🇽 Мексика',section:'vpn'},
  {key:'brazil',label:'🇧🇷 Бразилия',section:'vpn'},
  {key:'argentina',label:'🇦🇷 Аргентина',section:'vpn'},
  {key:'chile',label:'🇨🇱 Чили',section:'vpn'},
  {key:'russia',label:'🇷🇺 Россия',section:'vpn'},
  {key:'japan',label:'🇯🇵 Япония',section:'vpn'},
  {key:'south_korea',label:'🇰🇷 Корея',section:'vpn'},
  {key:'china',label:'🇨🇳 Китай (Гонконг)',section:'vpn'},
  {key:'singapore',label:'🇸🇬 Сингапур',section:'vpn'},
  {key:'india',label:'🇮🇳 Индия',section:'vpn'},
  {key:'uae',label:'🇦🇪 ОАЭ',section:'vpn'},
  {key:'israel',label:'🇮🇱 Израиль',section:'vpn'},
  {key:'turkey',label:'🇹🇷 Турция',section:'vpn'},
  {key:'south_africa',label:'🇿🇦 ЮАР',section:'vpn'},
  {key:'egypt',label:'🇪🇬 Египет',section:'vpn'},
  {key:'kenya',label:'🇰🇪 Кения',section:'vpn'},
  {key:'nigeria',label:'🇳🇬 Нигерия',section:'vpn'},
  {key:'australia',label:'🇦🇺 Австралия',section:'vpn'},
  {key:'new_zealand',label:'🇳🇿 Новая Зеландия',section:'vpn'},
  {key:'w_baltics',label:'🇱🇹🇪🇪🇱🇻 Прибалтика',section:'white'},
  {key:'w_finland',label:'🇫🇮 Финляндия',section:'white'},
  {key:'w_germany',label:'🇩🇪 Германия',section:'white'},
  {key:'w_sweden',label:'🇸🇪 Швеция',section:'white'},
  {key:'w_netherlands',label:'🇳🇱 Нидерланды',section:'white'},
  {key:'w_poland',label:'🇵🇱 Польша',section:'white'},
  {key:'russia_white',label:'🇷🇺 Россия (Москва)',section:'white'},
];

// КООРДИНАТЫ ДЛЯ ВСЕХ СТРАН
const COUNTRY_COORDS = {
  baltics: [56.9, 24.6],
  finland: [61.9, 25.7],
  sweden: [60.1, 18.6],
  norway: [59.9, 10.7],
  denmark: [55.7, 12.5],
  germany: [51.1, 10.5],
  netherlands: [52.1, 4.9],
  poland: [51.9, 19.1],
  uk: [51.5, -0.1],
  france: [46.6, 2.2],
  switzerland: [46.8, 8.2],
  italy: [41.9, 12.5],
  spain: [40.4, -3.7],
  usa: [38.9, -77.0],
  canada: [45.4, -75.7],
  mexico: [19.4, -99.1],
  brazil: [-15.8, -47.9],
  argentina: [-34.6, -58.4],
  chile: [-33.4, -70.6],
  russia: [55.8, 37.6],
  japan: [35.7, 139.7],
  south_korea: [37.6, 127.0],
  china: [22.3, 114.2],
  singapore: [1.3, 103.8],
  india: [21.1, 79.0],
  uae: [23.4, 54.8],
  israel: [31.0, 34.8],
  turkey: [39.9, 32.9],
  south_africa: [-33.9, 18.4],
  egypt: [30.0, 31.2],
  kenya: [-1.3, 36.8],
  nigeria: [6.5, 3.4],
  australia: [-33.9, 151.2],
  new_zealand: [-36.8, 174.7],
};

const COUNTRY_FLAGS = {
  baltics: '🇱🇹🇪🇪🇱🇻',
  finland: '🇫🇮',
  sweden: '🇸🇪',
  norway: '🇳🇴',
  denmark: '🇩🇰',
  germany: '🇩🇪',
  netherlands: '🇳🇱',
  poland: '🇵🇱',
  uk: '🇬🇧',
  france: '🇫🇷',
  switzerland: '🇨🇭',
  italy: '🇮🇹',
  spain: '🇪🇸',
  usa: '🇺🇸',
  canada: '🇨🇦',
  mexico: '🇲🇽',
  brazil: '🇧🇷',
  argentina: '🇦🇷',
  chile: '🇨🇱',
  russia: '🇷🇺',
  japan: '🇯🇵',
  south_korea: '🇰🇷',
  china: '🇨🇳',
  singapore: '🇸🇬',
  india: '🇮🇳',
  uae: '🇦🇪',
  israel: '🇮🇱',
  turkey: '🇹🇷',
  south_africa: '🇿🇦',
  egypt: '🇪🇬',
  kenya: '🇰🇪',
  nigeria: '🇳🇬',
  australia: '🇦🇺',
  new_zealand: '🇳🇿',
};

function detectProtocol(key) {
  if (key.includes('security=reality') || key.includes('pbk=')) return 'Reality';
  if (key.includes('type=ws') || key.includes('type=websocket')) return 'WebSocket';
  if (key.includes('type=grpc')) return 'gRPC';
  if (key.includes('type=tcp') || key.includes('flow=xtls')) return 'TCP';
  return 'Unknown';
}

function checkTLS(key) {
  if (key.includes('security=tls') || key.includes('security=reality')) return true;
  if (key.includes('security=none') || key.includes('security=')) return false;
  return null;
}

function makeCard(m) {
  return `<div class="card" id="card-${m.key}" style="display:none">
    <h2>⚡ Лучший ключ — ${m.label}</h2>
    <div class="key-box empty" id="key-${m.key}">Загрузка...</div>
    <button class="copy-btn" id="btn-${m.key}" disabled onclick="copyKey('${m.key}')">📋 Копировать</button>
    <div class="top5" id="top5-${m.key}"></div>
    <div class="stats" id="stats-${m.key}"></div>
  </div>`;
}

function buildCards() {
  document.getElementById('cards').innerHTML = MODES.map(makeCard).join('');
}

function switchMode(mode) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('onclick') === `switchMode('${mode}')`);
  });
  MODES.forEach(m => {
    document.getElementById(`card-${m.key}`).style.display = m.key === mode ? 'block' : 'none';
  });
}

async function loadData() {
  document.getElementById('updated').innerHTML = '⏳ Загрузка...';
  try {
    const resp = await fetch(KEYS_URL + '?t=' + Date.now());
    if (!resp.ok) throw new Error('Ошибка загрузки');
    data = await resp.json();
    renderAll();
    startUpdateTimer();
    initMap();
  } catch (e) {
    document.getElementById('updated').textContent = '❌ Ошибка загрузки данных';
  }
}

function initMap() {
  if (map) { map.remove(); }
  
  map = L.map('server-map').setView([20, 10], 2);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  
  let hasMarkers = false;
  
  MODES.forEach(m => {
    const coords = COUNTRY_COORDS[m.key];
    if (coords && data && data[m.key] && data[m.key].total_working > 0) {
      hasMarkers = true;
      const marker = L.circleMarker(coords, {
        radius: 8,
        fillColor: '#4ade80',
        color: '#4ade80',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(map);
      
      const flag = COUNTRY_FLAGS[m.key] || '🌍';
      const count = data[m.key].total_working || 0;
      const speed = data[m.key].best_info ? data[m.key].best_info.latency_ms : '?';
      
      marker.bindPopup(`
        <div style="color:#000;font-family:sans-serif;padding:4px;">
          <strong>${flag} ${m.label}</strong><br>
          Рабочих ключей: ${count}<br>
          Лучшая скорость: ${speed} мс
        </div>
      `);
    }
  });
  
  if (!hasMarkers) {
    const popup = L.popup()
      .setLatLng([20, 10])
      .setContent('Нет данных о серверах. Обновите страницу.')
      .openOn(map);
  }
}

function startUpdateTimer() {
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    const now = new Date();
    const nextUpdate = new Date(now);
    nextUpdate.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    const diff = Math.round((nextUpdate - now) / 60000);
    document.getElementById('next-update').textContent = diff + ' мин';
  }, 10000);
}

function renderAll() {
  const utcStr = data.updated_at;
  let displayTime = utcStr || '—';
  if (utcStr) {
    try {
      const d = new Date(utcStr.replace(' ', 'T').replace(' UTC', 'Z'));
      if (!isNaN(d)) {
        const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
        displayTime = msk.toISOString().slice(0, 16).replace('T', ' ') + ' МСК';
      }
    } catch (e) {}
  }
  document.getElementById('updated').textContent = '🔄 Обновлено: ' + displayTime;

  let totalKeys = 0, workingKeys = 0, totalLatency = 0, latencyCount = 0;
  const keyCounts = {};

  MODES.forEach(m => {
    if (data[m.key]) {
      totalKeys += data[m.key].total || 0;
      workingKeys += data[m.key].total_working || 0;
      keyCounts[m.key] = data[m.key].total_working || 0;
      if (data[m.key].best_info && data[m.key].best_info.latency_ms) {
        totalLatency += data[m.key].best_info.latency_ms;
        latencyCount++;
      }
    }
  });

  const successRate = totalKeys > 0 ? Math.round((workingKeys / totalKeys) * 100) : 0;
  
  document.getElementById('total-sources').textContent = '80+';
  document.getElementById('total-keys').textContent = totalKeys;
  document.getElementById('working-keys').textContent = workingKeys;
  document.getElementById('success-rate').textContent = successRate + '%';
  document.getElementById('avg-speed').textContent = latencyCount ? Math.round(totalLatency / latencyCount) + ' мс' : '—';

  const bars = document.querySelectorAll('.chart-bar');
  const heights = [20, 45, 70, 55, 90, 65, 100];
  const workingPercent = Math.min(100, Math.round((workingKeys / Math.max(1, totalKeys)) * 100));
  bars.forEach((bar, i) => {
    const h = i === 4 ? Math.max(10, workingPercent) : heights[i];
    bar.style.height = h + '%';
  });

  document.querySelectorAll('.tab').forEach(tab => {
    const mode = tab.getAttribute('onclick').match(/'([^']+)'/)[1];
    const count = keyCounts[mode] || 0;
    const existingCount = tab.querySelector('.key-count');
    if (existingCount) existingCount.remove();
    if (count > 0) {
      const span = document.createElement('span');
      span.className = 'key-count';
      span.textContent = `(${count})`;
      tab.appendChild(span);
    }
  });

  MODES.forEach(m => {
    try {
      if (data[m.key]) render(m.key);
    } catch (e) {}
  });
  
  if (map) {
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });
  }
  initMap();
}

function render(mode) {
  const keyEl = document.getElementById('key-' + mode);
  const btnEl = document.getElementById('btn-' + mode);
  const top5El = document.getElementById('top5-' + mode);
  const statsEl = document.getElementById('stats-' + mode);

  const d = data[mode];
  if (!d) return;

  if (d.best) {
    keyEl.textContent = d.best;
    keyEl.classList.remove('empty');
    btnEl.disabled = false;
  } else {
    keyEl.textContent = '😕 Рабочих ключей не найдено. Проверьте позже.';
    keyEl.classList.add('empty');
    btnEl.disabled = true;
  }

  statsEl.textContent = `📊 Рабочих: ${d.total_working} из ${d.total}`;

  const topList = d.top10 || [];
  if (topList.length > 0) {
    top5El.innerHTML = `<h3>🏆 ТОП-10 быстрых:</h3>` +
      topList.map((k, i) => {
        const protocol = detectProtocol(k.key);
        const tlsValid = checkTLS(k.key);
        const isFavorite = favorites[k.key] || false;
        return `<div class="top5-item">
          <span class="host">${i+1}. ${k.host}:${k.port}</span>
          <span class="protocol">${protocol}</span>
          <span class="latency">${k.latency_ms} мс</span>
          ${k.first_seen ? `<span class="uptime">⏱ ${formatUptime(k.first_seen)}</span>` : ''}
          <span class="tls-status">${tlsValid === true ? '🔒' : tlsValid === false ? '⚠️' : ''}</span>
          <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${encodeKey(k.key)}', this)">${isFavorite ? '★' : '☆'}</button>
          <button class="copy-small" onclick="copyText('${encodeKey(k.key)}', this)">копировать</button>
          <button class="share-btn" onclick="shareKey('${encodeKey(k.key)}')">📤</button>
          <button class="ping-btn" onclick="pingKey('${encodeKey(k.key)}', this)">📡</button>
        </div>`;
      }).join('');
  } else {
    top5El.innerHTML = '';
  }
}

function formatUptime(firstSeen) {
  const diff = Math.floor((Date.now() - new Date(firstSeen)) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + ' мин';
  if (diff < 86400) return Math.floor(diff / 3600) + ' ч';
  return Math.floor(diff / 86400) + ' д';
}

function encodeKey(key) {
  return key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function copyKey(mode) {
  const key = document.getElementById('key-' + mode).textContent;
  copyText(key, document.getElementById('btn-' + mode));
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => btn.textContent = orig, 1500);
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    const orig = btn.textContent;
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function shareKey(key) {
  if (navigator.share) {
    navigator.share({
      title: 'VLESS ключ',
      text: key,
    }).catch(() => {});
  } else {
    copyText(key, document.createElement('button'));
  }
}

function toggleFavorite(key, btn) {
  const decodedKey = key.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  if (favorites[decodedKey]) {
    delete favorites[decodedKey];
    btn.textContent = '☆';
    btn.classList.remove('active');
  } else {
    favorites[decodedKey] = true;
    btn.textContent = '★';
    btn.classList.add('active');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function pingKey(key, btn) {
  const decodedKey = key.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  btn.textContent = '⏳';
  btn.classList.add('pinging');
  
  const start = Date.now();
  const parsed = parseKey(decodedKey);
  if (!parsed) {
    btn.textContent = '❌';
    setTimeout(() => { btn.textContent = '📡'; btn.classList.remove('pinging'); }, 2000);
    return;
  }
  
  const host = parsed.host;
  const port = parsed.port;
  
  try {
    const ws = new WebSocket(`wss://${host}:${port}`);
    const timeout = setTimeout(() => {
      ws.close();
      btn.textContent = '⏱️';
      setTimeout(() => { btn.textContent = '📡'; btn.classList.remove('pinging'); }, 2000);
    }, 5000);
    
    ws.onopen = () => {
      const latency = Date.now() - start;
      clearTimeout(timeout);
      ws.close();
      btn.textContent = latency + 'мс';
      btn.style.color = latency < 100 ? '#4ade80' : latency < 300 ? '#fbbf24' : '#ef4444';
      setTimeout(() => { 
        btn.textContent = '📡'; 
        btn.style.color = '';
        btn.classList.remove('pinging'); 
      }, 3000);
    };
    
    ws.onerror = () => {
      clearTimeout(timeout);
      btn.textContent = '❌';
      setTimeout(() => { btn.textContent = '📡'; btn.classList.remove('pinging'); }, 2000);
    };
  } catch (e) {
    btn.textContent = '❌';
    setTimeout(() => { btn.textContent = '📡'; btn.classList.remove('pinging'); }, 2000);
  }
}

function parseKey(key) {
  try {
    const s = key.substring(9);
    const at = s.indexOf('@');
    const after = s.substring(at + 1);
    const hostPort = after.split('?')[0].split('#')[0];
    const host = hostPort.split(':')[0];
    const port = parseInt(hostPort.split(':')[1]) || 443;
    return { host, port };
  } catch {
    return null;
  }
}

function copyAllKeys() {
  if (!data) {
    alert('Данные ещё не загружены');
    return;
  }
  
  let allKeys = [];
  MODES.forEach(m => {
    if (data[m.key] && data[m.key].best) {
      allKeys.push(data[m.key].best);
    }
  });
  
  const text = allKeys.join('\n\n');
  copyText(text, document.createElement('button'));
}

function forceUpdate() {
  const btn = document.querySelector('.refresh-btn');
  btn.textContent = '⏳ Обновление...';
  btn.disabled = true;
  
  loadData().then(() => {
    btn.textContent = '✅ Обновлено!';
    setTimeout(() => {
      btn.textContent = '🔄 Обновить ключи';
      btn.disabled = false;
    }, 2000);
  }).catch(() => {
    btn.textContent = '❌ Ошибка';
    setTimeout(() => {
      btn.textContent = '🔄 Обновить ключи';
      btn.disabled = false;
    }, 2000);
  });
}

function showQR(key) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const box = document.createElement('div');
  box.style.cssText = 'background:#1a1a24;padding:24px;border-radius:16px;max-width:340px;width:90%;text-align:center;border:1px solid #333;';

  box.innerHTML = `
    <h3 style="color:#fff;margin-bottom:12px;font-size:1.1rem;">📱 QR-код</h3>
    <div id="qr-code-container" style="background:#fff;padding:16px;border-radius:12px;display:inline-block;"></div>
    <p style="color:#888;font-size:0.75rem;margin-top:12px;">Наведите камеру телефона</p>
    <button onclick="this.closest('.qr-overlay').remove()" style="margin-top:12px;padding:8px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.85rem;">Закрыть</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  if (typeof QRCode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = () => {
      new QRCode(document.getElementById('qr-code-container'), {
        text: key,
        width: 240,
        height: 240,
        colorDark: '#000000',
        colorLight: '#ffffff',
      });
    };
    document.head.appendChild(script);
  } else {
    new QRCode(document.getElementById('qr-code-container'), {
      text: key,
      width: 240,
      height: 240,
      colorDark: '#000000',
      colorLight: '#ffffff',
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.copy-small').forEach(btn => {
    const match = btn.getAttribute('onclick').match(/'([^']+)'/);
    if (match) {
      const key = match[1];
      const qrBtn = document.createElement('button');
      qrBtn.textContent = '📱 QR';
      qrBtn.className = 'copy-small';
      qrBtn.onclick = () => showQR(key);
      qrBtn.style.marginLeft = '4px';
      btn.parentElement.appendChild(qrBtn);
    }
  });
});

setInterval(loadData, 60000);
buildCards();
loadData();
