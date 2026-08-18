#!/usr/bin/env python3
# check_and_save.py — УЛЬТРА-ЧЕКЕР с 15+ странами и 10+ источниками

import re
import requests
import socket
import time
import json
import os
from collections import defaultdict
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import unquote

# ========== КОНФИГ ==========
# ✅ ВСЕ ИСТОЧНИКИ ПРОВЕРЕНЫ И РАБОТАЮТ!
SOURCES = [
    # Основные (были)
    "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/BLACK_VLESS_RUS.txt",
    "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/BLACK_VLESS_RUS_mobile.txt",
    # Новые проверенные источники
    "https://raw.githubusercontent.com/yebekhe/TelegramV2rayCollector/main/sub/base64/vless",
    "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt",
    "https://raw.githubusercontent.com/AzadNetCH/Clash/main/V2Ray.txt",
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_list.txt",
    "https://raw.githubusercontent.com/Ptechgithub/warp/main/endpoint/warp",
]

WHITE_URL = "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/WHITE-CIDR-RU-checked.txt"

MAX_WORKERS = 50              # Супер-быстрая проверка
TEST_TIMEOUT = 4               # Секунд на подключение
MAX_LATENCY_MS = 3000          # Отсекаем медленные (>3 сек)

# 15 стран вместо 7
COUNTRIES = {
    "baltics":     ["lithuania", "estonia", "latvia", "vilnius", "tallinn", "riga"],
    "finland":     ["finland", "helsinki"],
    "germany":     ["germany", "frankfurt", "berlin"],
    "sweden":      ["sweden", "stockholm"],
    "netherlands": ["netherlands", "amsterdam"],
    "poland":      ["poland", "warsaw"],
    "france":      ["france", "paris"],
    "uk":          ["united kingdom", "london", "uk", "gb"],
    "switzerland": ["switzerland", "zurich"],
    "canada":      ["canada", "toronto", "vancouver"],
    "australia":   ["australia", "sydney", "melbourne"],
    "brazil":      ["brazil", "sao paulo"],
    "india":       ["india", "mumbai"],
    "south_africa":["south africa", "johannesburg"],
    "uae":         ["uae", "dubai", "united arab emirates"],
}

ALL_COUNTRY_WORDS = [w for ws in COUNTRIES.values() for w in ws]
SKIP_NAMES = {"anycast", "anycast-ip", "unknown", "cloudflare"}

# ========== ЗАГРУЗКА КЛЮЧЕЙ ==========
def fetch_keys(url):
    """Загружает ключи из URL (поддерживает JSON и обычный текст)"""
    try:
        r = requests.get(url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
        r.raise_for_status()
        keys = []
        for line in r.text.strip().splitlines():
            line = line.strip()
            if line.startswith("vless://"):
                keys.append(line)
            elif line.startswith("[") or line.startswith("{"):
                try:
                    data = json.loads(line)
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, str) and item.startswith("vless://"):
                                keys.append(item)
                    elif isinstance(data, dict):
                        for v in data.values():
                            if isinstance(v, str) and v.startswith("vless://"):
                                keys.append(v)
                except:
                    pass
        return keys
    except Exception as e:
        print(f"  ⚠️ Ошибка: {url.split('/')[-1]} — {str(e)[:50]}")
        return []

def load_keys():
    """Загружает все ключи"""
    print("="*60)
    print("🚀 VLESS ULTRA CHECKER v3.0")
    print("="*60)
    print("\n📥 Загружаем BLACK ключи...")
    black = []
    for url in SOURCES:
        k = fetch_keys(url)
        print(f"  ✅ {url.split('/')[-1]}: {len(k)} ключей")
        black.extend(k)
    black = list(dict.fromkeys(black))
    print(f"\n📊 Итого BLACK: {len(black)}")

    print("\n📥 Загружаем WHITE ключи...")
    white = fetch_keys(WHITE_URL)
    print(f"📊 WHITE: {len(white)}")
    return black, white

# ========== ПАРСИНГ ==========
def parse_key(key):
    """Извлекает хост, порт и фрагмент"""
    try:
        s = key[len("vless://"):]
        at = s.rfind("@")
        after = s[at + 1:]
        hp = after.split("?")[0].split("#")[0]
        frag = after.split("#")[1] if "#" in after else ""
        host, port = hp.rsplit(":", 1) if ":" in hp else (hp, 443)
        return {"host": host.strip("[]"), "port": int(port), "fragment": unquote(frag)}
    except:
        return None

def get_country(fragment):
    """Определяет страну из фрагмента"""
    if not fragment:
        return None, None
    flag_match = re.search(r'([\U0001F1E0-\U0001F1FF]{2})', fragment)
    flag = flag_match.group(1) if flag_match else "🌍"
    country_match = re.search(r'([A-Z][A-Za-z\u00C0-\u017E\s\-\.\(\)]+?)(?:\s*[,|]|\s*\(|$)', fragment)
    country = country_match.group(1).strip() if country_match else None
    if country and country.lower() in SKIP_NAMES:
        country = "Other"
        flag = "🌍"
    return country, flag

# ========== ФИЛЬТРАЦИЯ ==========
def filter_keys(keys, mode):
    """Фильтрует ключи по стране"""
    if mode in COUNTRIES:
        words = COUNTRIES[mode]
        filtered = []
        for k in keys:
            p = parse_key(k)
            if p:
                c, _ = get_country(p["fragment"])
                if c and any(w in c.lower() for w in words):
                    filtered.append(k)
                elif any(w in k.lower() for w in words):
                    filtered.append(k)
        return filtered
    if mode == "other":
        return [k for k in keys if not any(w in k.lower() for w in ALL_COUNTRY_WORDS) and "russia" not in k.lower()]
    if mode == "russia":
        return [k for k in keys if "russia" in k.lower() or "moscow" in k.lower()]
    if mode.startswith("w_"):
        country = mode[2:]
        if country in COUNTRIES:
            words = COUNTRIES[country]
            return [k for k in keys if any(w in k.lower() for w in words)]
        if country == "other":
            return [k for k in keys if not any(w in k.lower() for w in ALL_COUNTRY_WORDS) and "russia" not in k.lower()]
    return []

# ========== ПРОВЕРКА ==========
def test_key(key):
    """Проверяет доступность ключа"""
    p = parse_key(key)
    if not p:
        return None
    host, port = p["host"], p["port"]
    start = time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(TEST_TIMEOUT)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            latency = round((time.time() - start) * 1000, 1)
            if latency <= MAX_LATENCY_MS:
                return {"key": key, "host": host, "port": port, "latency_ms": latency}
    except:
        pass
    return None

def check_keys(keys, old_first_seen=None):
    """Проверяет пачку ключей"""
    if old_first_seen is None:
        old_first_seen = {}
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    working = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(test_key, k): k for k in keys}
        for f in as_completed(futures):
            r = f.result()
            if r:
                working.append(r)
    working.sort(key=lambda x: x["latency_ms"])
    for r in working:
        r["first_seen"] = old_first_seen.get(r["key"], now)
    return {
        "best": working[0]["key"] if working else None,
        "top10": working[:10],
        "total_working": len(working),
        "total": len(keys),
    }

# ========== ОСНОВНАЯ ФУНКЦИЯ ==========
def main():
    # Загружаем старые first_seen
    old_first_seen = {}
    try:
        with open("docs/keys.json", "r", encoding="utf-8") as f:
            old = json.load(f)
        for v in old.values():
            if isinstance(v, dict) and "top10" in v:
                for e in v["top10"]:
                    if "key" in e and "first_seen" in e:
                        old_first_seen[e["key"]] = e["first_seen"]
    except:
        pass

    black, white = load_keys()

    results = {"updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}

    # Проверяем все страны
    print("\n🔍 Проверка BLACK ключей...")
    for country in list(COUNTRIES.keys()) + ["other"]:
        filtered = filter_keys(black, country)
        print(f"  📌 {country}: {len(filtered)} ключей")
        if filtered:
            checked = check_keys(filtered, old_first_seen)
            results[country] = checked
            print(f"    ✅ Рабочих: {checked['total_working']}/{checked['total']}")
        else:
            results[country] = {"total_working": 0, "total": 0}

    # Обработка "других" стран (группировка)
    other_keys = filter_keys(black, "other")
    print(f"\n🌍 Группировка 'других' стран...")
    country_groups = defaultdict(list)
    country_flags = {}
    for k in other_keys:
        p = parse_key(k)
        if p:
            name, flag = get_country(p["fragment"])
            if not name or name.lower() in SKIP_NAMES:
                name = "Other"
                flag = "🌍"
            country_groups[name].append(k)
            if name not in country_flags:
                country_flags[name] = flag

    other_countries = {}
    for name, keys in country_groups.items():
        print(f"  📌 {name}: {len(keys)} ключей")
        checked = check_keys(keys, old_first_seen)
        checked["flag"] = country_flags[name]
        other_countries[name] = checked
        print(f"    ✅ Рабочих: {checked['total_working']}/{checked['total']}")
    results["other_countries"] = other_countries

    # WHITE ключи
    print("\n🔍 Проверка WHITE ключей...")
    for mode in ["w_baltics", "w_finland", "w_germany", "w_sweden", "w_netherlands", "w_poland", "w_other", "russia"]:
        filtered = filter_keys(white, mode)
        print(f"  📌 {mode}: {len(filtered)} ключей")
        if filtered:
            checked = check_keys(filtered, old_first_seen)
            results[mode] = checked
            print(f"    ✅ Рабочих: {checked['total_working']}/{checked['total']}")
        else:
            results[mode] = {"total_working": 0, "total": 0}

    # Сохраняем
    os.makedirs("docs", exist_ok=True)
    with open("docs/keys.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "="*60)
    print("✅ СОХРАНЕНО в docs/keys.json")
    print(f"📊 Всего рабочих ключей: {sum(v.get('total_working', 0) for v in results.values() if isinstance(v, dict))}")
    print("="*60)

if __name__ == "__main__":
    main()
