#!/usr/bin/env python3
# check_and_save.py — ULTIMATE VLESS CHECKER (ВСЕ СТРАНЫ)

import re
import requests
import socket
import time
import json
import os
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import unquote

# ==================== 40+ ИСТОЧНИКОВ ====================
SOURCES = [
    "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/BLACK_VLESS_RUS.txt",
    "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/BLACK_VLESS_RUS_mobile.txt",
    "https://raw.githubusercontent.com/yebekhe/TelegramV2rayCollector/main/sub/base64/vless",
    "https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/sub.txt",
    "https://raw.githubusercontent.com/AzadNetCH/Clash/main/V2Ray.txt",
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_list.txt",
    "https://raw.githubusercontent.com/Ptechgithub/warp/main/endpoint/warp",
    "https://raw.githubusercontent.com/MahanKenway/Freedom-V2Ray/main/configs/vless.txt",
    "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/main/subscriptions/filtered/subs/vless.txt",
    "https://raw.githubusercontent.com/SoliSpirit/SolVPN/main/Protocols/vless.txt",
    "https://github.com/Delta-Kronecker/V2ray-Config/raw/refs/heads/main/config/protocols/vless.txt",
    "https://raw.githubusercontent.com/ShatakVPN/ConfigForge-V2Ray/main/configs/vless.txt",
    "https://raw.githubusercontent.com/kort0881/vpn-vless-configs-russia/main/githubmirror/clean/vless.txt",
    "https://raw.githubusercontent.com/kort0881/vpn-vless-configs-russia/main/githubmirror/ru-sni/vless_ru.txt",
    "https://raw.githubusercontent.com/gfpcom/free-proxy-list/main/list/vless.txt",
    "https://raw.githubusercontent.com/vlesscollector/vlesscollector/refs/heads/main/vless_configs.txt",
    "https://raw.githubusercontent.com/youfoundamin/V2rayCollector/main/vless_iran.txt",
    "https://raw.githubusercontent.com/MrEndi777709/Endi-VPN/main/mrendi-vpn-all.txt",
    "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/vless.txt",
    "https://raw.githubusercontent.com/SoliSpirit/v2ray-configs/refs/heads/main/Protocols/vless.txt",
    "https://raw.githubusercontent.com/darknessm427/IranConfigCollector/main/bulk/vless_iran.txt",
    "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/All_Configs_Sub.txt",
    "https://raw.githubusercontent.com/Surfboardv2ray/TGParse/main/splitted/vless",
    "https://raw.githubusercontent.com/miladtahanian/Config-Collector/main/vless_iran.txt",
    "https://raw.githubusercontent.com/Sage-77/V2ray-configs/main/vless.txt",
]

WHITE_URL = "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/main/WHITE-CIDR-RU-checked.txt"

MAX_WORKERS = 100
TEST_TIMEOUT = 3
MAX_LATENCY_MS = 5000

# ==================== ВСЕ СТРАНЫ (БЕЗ OTHER!) ====================
COUNTRIES = {
    "baltics": ["lithuania", "estonia", "latvia"],
    "finland": ["finland"],
    "germany": ["germany"],
    "sweden": ["sweden"],
    "netherlands": ["netherlands"],
    "poland": ["poland"],
    "france": ["france"],
    "uk": ["united kingdom", "london"],
    "switzerland": ["switzerland"],
    "canada": ["canada"],
    "australia": ["australia"],
    "brazil": ["brazil"],
    "india": ["india"],
    "south_africa": ["south africa"],
    "uae": ["uae", "dubai"],
    "japan": ["japan", "tokyo"],
    "south_korea": ["south korea", "korea", "seoul"],
    "singapore": ["singapore"],
    "hong_kong": ["hong kong"],
    "spain": ["spain", "madrid"],
    "italy": ["italy", "rome"],
    "norway": ["norway", "oslo"],
    "denmark": ["denmark", "copenhagen"],
    "argentina": ["argentina", "buenos aires"],
    "chile": ["chile", "santiago"],
    "mexico": ["mexico", "mexico city"],
    "egypt": ["egypt", "cairo"],
    "kenya": ["kenya", "nairobi"],
    "nigeria": ["nigeria", "lagos"],
    "new_zealand": ["new zealand", "auckland"],
}

ALL_COUNTRY_WORDS = [w for ws in COUNTRIES.values() for w in ws]
SKIP_NAMES = {"anycast", "unknown", "cloudflare"}

def fetch_keys(url):
    try:
        r = requests.get(url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
        r.raise_for_status()
        keys = []
        for line in r.text.strip().splitlines():
            line = line.strip()
            if line.startswith("vless://"):
                keys.append(line)
        return keys
    except:
        return []

def load_keys():
    print("="*60)
    print("🚀 VLESS ULTRA CHECKER (ВСЕ СТРАНЫ)")
    print("="*60)
    print(f"\n📥 Загружаем из {len(SOURCES)} источников...")
    black = []
    for url in SOURCES:
        k = fetch_keys(url)
        if k:
            print(f"  ✅ {url.split('/')[-1]}: {len(k)} ключей")
            black.extend(k)
    black = list(dict.fromkeys(black))
    print(f"\n📊 Итого BLACK: {len(black)}")
    white = fetch_keys(WHITE_URL)
    print(f"📊 WHITE: {len(white)}")
    return black, white

def parse_key(key):
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

def filter_keys(keys, mode):
    if mode in COUNTRIES:
        words = COUNTRIES[mode]
        return [k for k in keys if any(w in k.lower() for w in words)]
    if mode == "russia":
        return [k for k in keys if "russia" in k.lower() or "moscow" in k.lower()]
    if mode.startswith("w_"):
        country = mode[2:]
        if country in COUNTRIES:
            words = COUNTRIES[country]
            return [k for k in keys if any(w in k.lower() for w in words)]
    return []

def test_key(key):
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

def main():
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

    print("\n🔍 Проверка BLACK ключей...")
    for country in list(COUNTRIES.keys()):
        filtered = filter_keys(black, country)
        print(f"  📌 {country}: {len(filtered)} ключей")
        if filtered:
            results[country] = check_keys(filtered, old_first_seen)
            print(f"    ✅ Рабочих: {results[country]['total_working']}/{results[country]['total']}")
        else:
            results[country] = {"total_working": 0, "total": 0}

    print("\n🔍 Проверка WHITE ключей...")
    for mode in ["w_baltics", "w_finland", "w_germany", "w_sweden", "w_netherlands", "w_poland", "russia"]:
        filtered = filter_keys(white, mode)
        print(f"  📌 {mode}: {len(filtered)} ключей")
        if filtered:
            results[mode] = check_keys(filtered, old_first_seen)
            print(f"    ✅ Рабочих: {results[mode]['total_working']}/{results[mode]['total']}")
        else:
            results[mode] = {"total_working": 0, "total": 0}

    os.makedirs("docs", exist_ok=True)
    with open("docs/keys.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "="*60)
    print("✅ СОХРАНЕНО в docs/keys.json")
    total = sum(v.get('total_working', 0) for v in results.values() if isinstance(v, dict))
    print(f"📊 Всего рабочих ключей: {total}")
    print("="*60)

if __name__ == "__main__":
    main()
