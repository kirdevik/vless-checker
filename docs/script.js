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
      const clone = tabBtn.cloneNode(true);
      clone.disabled = true;
      clone.style.display = '';
      if (m.section === 'vpn') emptyVpn.push(clone);
      else emptyWhite.push(clone);
      tabBtn.disabled = true;
      tabBtn.style.display = 'none';
    }
  });

  setupCollapsed('tabs-collapsed', 'collapsed-toggle', 'collapsed-label', emptyVpn);
  setupCollapsed('tabs-collapsed-white', 'collapsed-toggle-white', 'collapsed-label-white', emptyWhite);
}

function setupCollapsed(collapsedId, toggleId, labelId, emptyTabs) {
  const collapsed = document.getElementById(collapsedId);
  const toggle = document.getElementById(toggleId);
  const label = document.getElementById(labelId);
  collapsed.innerHTML = '';
  if (emptyTabs.length > 0) {
    emptyTabs.forEach(btn => collapsed.appendChild(btn));
    label.textContent = '📭 Нет ключей: ' + emptyTabs.length;
    toggle.style.display = 'flex';
  } else {
    toggle.style.display = 'none';
  }
}

function toggleCollapsed() {
  document.getElementById('collapsed-toggle').classList.toggle('open');
  document.getElementById('tabs-collapsed').classList.toggle('open');
}

function toggleCollapsedWhite() {
  document.getElementById('collapsed-toggle-white').classList.toggle('open');
  document.getElementById('tabs-collapsed-white').classList.toggle('open');
}

function renderCountryBlock(name, d) {
  const topList = d.top10 || [];
  const flag = d.flag || '🌍';
  let html = `<div class="country-block">
    <h3 class="country-title">${flag} ${name} <span class="country-stats">· ${d.total_working} из ${d.total}</span></h3>`;
  if (topList.length > 0) {
    html += topList.map((k, i) => {
      const protocol = detectProtocol(k.key);
      return `<div class="top5-item">
        <span class="host">${i+1}. ${k.host}:${k.port}</span>
        <span class="protocol">${protocol}</span>
        <span class="latency">${k.latency_ms} мс</span>
        ${k.first_seen ? `<span class="uptime">⏱ ${formatUptime(k.first_seen)}</span>` : ''}
        <button class="copy-small" onclick="copyText('${encodeKey(k.key)}', this)">копировать</button>
        <button class="share-btn" onclick="shareKey('${encodeKey(k.key)}')">📤</button>
      </div>`;
    }).join('');
  } else {
    html += `<div class="top5-item"><span class="host">Нет рабочих ключей</span></div>`;
  }
  html += '</div>';
  return html;
}

function render(mode) {
  const keyEl = document.getElementById('key-' + mode);
  const btnEl = document.getElementById('btn-' + mode);
  const top5El = document.getElementById('top5-' + mode);
  const statsEl = document.getElementById('stats-' + mode);

  if (mode === 'other' && data.other_countries) {
    keyEl.style.display = 'none';
    btnEl.style.display = 'none';
    statsEl.style.display = 'none';
    const sorted = Object.entries(data.other_countries)
      .filter(([, c]) => c.total_working > 0)
      .sort((a, b) => b[1].total_working - a[1].total_working);
    top5El.innerHTML = sorted.length > 0
      ? sorted.map(([name, c]) => renderCountryBlock(name, c)).join('')
      : '<p style="text-align:center;color:#555;padding:20px;">Нет рабочих ключей в других странах</p>';
    return;
  }

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
        return `<div class="top5-item">
          <span class="host">${i+1}. ${k.host}:${k.port}</span>
          <span class="protocol">${protocol}</span>
          <span class="latency">${k.latency_ms} мс</span>
          ${k.first_seen ? `<span class="uptime">⏱ ${formatUptime(k.first_seen)}</span>` : ''}
          <button class="copy-small" onclick="copyText('${encodeKey(k.key)}', this)">копировать</button>
          <button class="share-btn" onclick="shareKey('${encodeKey(k.key)}')">📤</button>
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

function copyAllKeys() {
  if (!data) {
    alert('Данные ещё не загружены');
    return;
  }
  
  let allKeys = [];
  MODES.forEach(m => {
    if (m.key === 'other' && data.other_countries) {
      Object.values(data.other_countries).forEach(c => {
        if (c.best) allKeys.push(c.best);
      });
    } else if (data[m.key] && data[m.key].best) {
      allKeys.push(data[m.key].best);
    }
  });
  
  const text = allKeys.join('\n\n');
  copyText(text, document.createElement('button'));
}

function exportKeys() {
  if (!data) {
    alert('Данные ещё не загружены');
    return;
  }
  
  let allKeys = [];
  MODES.forEach(m => {
    if (m.key === 'other' && data.other_countries) {
      Object.values(data.other_countries).forEach(c => {
        if (c.best) allKeys.push(c.best);
      });
    } else if (data[m.key] && data[m.key].best) {
      allKeys.push(data[m.key].best);
    }
  });
  
  const text = allKeys.join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vless_keys.txt';
  a.click();
}

function forceUpdate() {
  const btn = document.querySelector('.refresh-btn');
  btn.textContent = '⏳ Обновление...';
  btn.disabled = true;
  
  fetch('https://api.github.com/repos/kirdevik/vless-checker/actions/workflows/check_keys.yml/dispatches', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + (localStorage.getItem('github_token') || '')
    },
    body: JSON.stringify({ ref: 'main' })
  }).then(() => {
    btn.textContent = '✅ Запущено!';
    setTimeout(() => {
      btn.textContent = '🔄 Обновить всё';
      btn.disabled = false;
    }, 3000);
  }).catch(() => {
    btn.textContent = '❌ Ошибка';
    setTimeout(() => {
      btn.textContent = '🔄 Обновить всё';
      btn.disabled = false;
    }, 3000);
  });
}

// ===== QR-КОД (РАБОТАЕТ!) =====
function showQR(key) {
  // Удаляем старый QR, если есть
  const oldQR = document.querySelector('.qr-overlay');
  if (oldQR) oldQR.remove();

  const overlay = document.createElement('div');
  overlay.className = 'qr-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;';
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

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

  // Загружаем QR-библиотеку, если ещё не загружена
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

function applyFilters() {
  currentFilter = document.getElementById('protocol-filter').value;
  searchQuery = document.getElementById('search-input').value.toLowerCase();
  
  document.querySelectorAll('.tab').forEach(tab => {
    const label = tab.textContent.toLowerCase();
    if (searchQuery && !label.includes(searchQuery)) {
      tab.style.display = 'none';
    } else {
      tab.style.display = '';
    }
  });
}

// Добавляем QR-кнопки ко всем ключам автоматически
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
