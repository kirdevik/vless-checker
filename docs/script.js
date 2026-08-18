const KEYS_URL = 'keys.json';
let data = null;
let currentFilter = 'all';
let searchQuery = '';
let updateInterval = null;

const MODES = [
  {key:'baltics',label:'🇱🇹🇪🇪🇱🇻 Прибалтика',section:'vpn'},
  {key:'finland',label:'🇫🇮 Финляндия',section:'vpn'},
  {key:'germany',label:'🇩🇪 Германия',section:'vpn'},
  {key:'sweden',label:'🇸🇪 Швеция',section:'vpn'},
  {key:'netherlands',label:'🇳🇱 Нидерланды',section:'vpn'},
  {key:'poland',label:'🇵🇱 Польша',section:'vpn'},
  {key:'france',label:'🇫🇷 Франция',section:'vpn'},
  {key:'uk',label:'🇬🇧 Великобритания',section:'vpn'},
  {key:'switzerland',label:'🇨🇭 Швейцария',section:'vpn'},
  {key:'canada',label:'🇨🇦 Канада',section:'vpn'},
  {key:'australia',label:'🇦🇺 Австралия',section:'vpn'},
  {key:'brazil',label:'🇧🇷 Бразилия',section:'vpn'},
  {key:'india',label:'🇮🇳 Индия',section:'vpn'},
  {key:'south_africa',label:'🇿🇦 ЮАР',section:'vpn'},
  {key:'uae',label:'🇦🇪 ОАЭ',section:'vpn'},
  {key:'other',label:'🌍 Остальные',section:'vpn'},
  {key:'w_baltics',label:'🇱🇹🇪🇪🇱🇻 Прибалтика',section:'white'},
  {key:'w_finland',label:'🇫🇮 Финляндия',section:'white'},
  {key:'w_germany',label:'🇩🇪 Германия',section:'white'},
  {key:'w_sweden',label:'🇸🇪 Швеция',section:'white'},
  {key:'w_netherlands',label:'🇳🇱 Нидерланды',section:'white'},
  {key:'w_poland',label:'🇵🇱 Польша',section:'white'},
  {key:'w_other',label:'🌍 Остальные',section:'white'},
  {key:'russia',label:'🇷🇺 Россия (Москва)',section:'white'},
];

function detectProtocol(key) {
  if (key.includes('security=reality') || key.includes('pbk=')) return 'Reality';
  if (key.includes('type=ws') || key.includes('type=websocket')) return 'WebSocket';
  if (key.includes('type=grpc')) return 'gRPC';
  if (key.includes('type=tcp') || key.includes('flow=xtls')) return 'TCP';
  return 'Unknown';
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
  } catch (e) {
    document.getElementById('updated').textContent = '❌ Ошибка загрузки данных';
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
    if (m.key === 'other') {
      if (data.other_countries) {
        Object.values(data.other_countries).forEach(c => {
          totalKeys += c.total || 0;
          workingKeys += c.total_working || 0;
          keyCounts[m.key] = (keyCounts[m.key] || 0) + (c.total_working || 0);
          if (c.best_info && c.best_info.latency_ms) {
            totalLatency += c.best_info.latency_ms;
            latencyCount++;
          }
        });
      }
    } else if (data[m.key]) {
      totalKeys += data[m.key].total || 0;
      workingKeys += data[m.key].total_working || 0;
      keyCounts[m.key] = data[m.key].total_working || 0;
      if (data[m.key].best_info && data[m.key].best_info.latency_ms) {
        totalLatency += data[m.key].best_info.latency_ms;
        latencyCount++;
      }
    }
  });

  document.getElementById('total-sources').textContent = '40+';
  document.getElementById('total-keys').textContent = totalKeys;
  document.getElementById('working-keys').textContent = workingKeys;
  document.getElementById('avg-speed').textContent = latencyCount ? Math.round(totalLatency / latencyCount) + ' мс' : '—';

  // Обновляем количество ключей в вкладках
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

  const emptyVpn = [], emptyWhite = [];
  MODES.forEach(m => {
    try {
      if (m.key === 'other' ? data.other_countries : data[m.key]) render(m.key);
    } catch (e) {}

    const hasKeys = m.key === 'other'
      ? data.other_countries && Object.values(data.other_countries).some(c => c.total_working > 0)
      : data[m.key] && data[m.key].total_working > 0;

    const tabBtn = document.querySelector(
      `#tabs-countries [onclick="switchMode('${m.key}')"], #tabs-white [onclick="switchMode('${m.key}')"]`
    );
    if (!tabBtn) return;

    if (hasKeys) {
      tabBtn.disabled = false;
      tabBtn.style.display = '';
    } else {
