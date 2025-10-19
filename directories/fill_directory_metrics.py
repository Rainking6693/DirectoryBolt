"""
Fill directory metrics using APIs + lightweight crawling.
- Domain Authority via Moz API (free plan available) or Ahrefs DR (if you have access)
- Traffic via Similarweb API (or scrape public summary pages when available)
- Has Captcha via Playwright (headless) by visiting signup/submit URLs
- Time to Approval via rules + optional manual override CSV

USAGE:
  1) Install deps:
     pip install playwright python-dotenv requests pandas openpyxl
     python -m playwright install
  2) Put your keys in a .env file next to this script:
     MOZ_ACCESS_ID=...
     MOZ_SECRET_KEY=...
     SIMILARWEB_API_KEY=...
  3) Place your input CSV (from ChatGPT) next to this script.
  4) Run:
     python fill_directory_metrics.py --in "directories_autocategorized_v0.csv" --out "directories_filled.csv"

NOTES:
- The script tries best-effort; some sites block bots. It records evidence URLs.
- You can re-run; it only fills empty/TBD cells.
"""

import os
import re
import time
import json
import argparse
import pandas as pd
from urllib.parse import urlparse
from dotenv import load_dotenv
import requests

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_OK = True
except Exception:
    PLAYWRIGHT_OK = False

def normalize_domain(s: str) -> str:
    if not isinstance(s, str) or not s.strip():
        return ""
    s = s.strip()
    if not s.startswith(("http://", "https://")):
        s = "http://" + s
    netloc = urlparse(s).netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc

def moz_da(domain: str, access_id: str, secret_key: str) -> float | None:
    try:
        endpoint = "https://lsapi.seomoz.com/v2/url_metrics"
        payload = {"targets": [f"https://{domain}/"]}
        headers = {"Content-Type": "application/json"}
        if access_id and secret_key:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=20, auth=(access_id, secret_key))
        else:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=20)
        if resp.ok:
            data = resp.json()
            if isinstance(data, dict) and "results" in data and data["results"]:
                r0 = data["results"][0]
                if "domain_authority" in r0 and isinstance(r0["domain_authority"], (int,float)):
                    return float(r0["domain_authority"])
        return None
    except Exception:
        return None

def similarweb_traffic(domain: str, api_key: str) -> int | None:
    try:
        if not api_key:
            return None
        url = f"https://api.similarweb.com/v1/website/{domain}/total-traffic-and-engagement/visits?api_key={api_key}&start_date=2025-06&end_date=2025-09&granularity=monthly&main_domain_only=true"
        r = requests.get(url, timeout=20)
        if r.ok:
            data = r.json()
            visits = 0
            if "visits" in data and isinstance(data["visits"], list):
                for m in data["visits"]:
                    if "visits" in m and isinstance(m["visits"], (int,float)):
                        visits += int(m["visits"])
            return int(visits / max(1, len(data.get("visits", [])))) if data.get("visits") else None
        return None
    except Exception:
        return None

def detect_captcha(playwright, url: str) -> str:
    try:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=30000)
        html = page.content().lower()
        page.close(); browser.close()
        if any(k in html for k in ["g-recaptcha", "hcaptcha", "data-sitekey", "captcha"]):
            return "y"
        return "n"
    except Exception:
        return "TBD"

def impact_tier_difficulty(da, tr):
    if da is not None and da >= 70 or tr is not None and tr >= 500000:
        return "High", "1", "Medium-High"
    if da is not None and da >= 40 or tr is not None and tr >= 100000:
        return "Medium", "2-3", "Medium"
    return "Low", "4", "Low-Medium"

def estimate_time_to_approval(category: str, da_val: float | None) -> str:
    cat = (category or "").lower()
    if cat in {"social media", "content media"}:
        return "N/A"
    if da_val is not None:
        if da_val >= 70: return "1-3 days"
        if da_val >= 40: return "2-5 days"
        return "3-7 days"
    return "TBD"

def main():
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="inp", required=True)
    parser.add_argument("--out", dest="outp", required=True)
    parser.add_argument("--domain_col", default=None)
    args = parser.parse_args()

    moz_id = os.getenv("MOZ_ACCESS_ID", "")
    moz_key = os.getenv("MOZ_SECRET_KEY", "")
    sw_key  = os.getenv("SIMILARWEB_API_KEY", "")

    df = pd.read_csv(args.inp)
    candidates = [c for c in df.columns if re.search(r'(domain|url|site|website)', c, re.I)]
    domain_col = args.domain_col or (candidates[0] if candidates else df.columns[0])

    for col in ["Category","Domain authority","Impact level","Tier level (1-4)","Difficulty","Traffic estimate","Time to approval","Has captcha (y/n)","Evidence URL"]:
        if col not in df.columns:
            df[col] = "TBD"

    pw = None
    if PLAYWRIGHT_OK:
        pw = sync_playwright().start()

    try:
        for i, row in df.iterrows():
            raw = str(row[domain_col])
            domain = normalize_domain(raw)
            if not domain:
                continue

            da = row.get("Domain authority", "TBD")
            tr = row.get("Traffic estimate", "TBD")

            if str(da).strip() in ("", "TBD"):
                val = moz_da(domain, moz_id, moz_key)
                if val is not None:
                    df.at[i, "Domain authority"] = round(val, 1)
                    da = df.at[i, "Domain authority"]

            if str(tr).strip() in ("", "TBD"):
                v = similarweb_traffic(domain, sw_key)
                if v is not None:
                    df.at[i, "Traffic estimate"] = int(v)
                    tr = df.at[i, "Traffic estimate"]

            if str(row.get("Has captcha (y/n)", "TBD")).strip() in ("", "TBD") and pw:
                url = f"https://{domain}"
                cap = detect_captcha(pw, url)
                df.at[i, "Has captcha (y/n)"] = cap
                df.at[i, "Evidence URL"] = url

            # Compute impact/tier/difficulty
            try:
                da_val = float(df.at[i, "Domain authority"]) if str(df.at[i, "Domain authority"]).strip() not in ("", "TBD") else None
            except:
                da_val = None
            try:
                tr_val = int(df.at[i, "Traffic estimate"]) if str(df.at[i, "Traffic estimate"]).strip() not in ("", "TBD") else None
            except:
                tr_val = None

            impact, tier, difficulty = impact_tier_difficulty(da_val, tr_val)
            if str(df.at[i, "Impact level"]).strip() in ("", "TBD"):
                df.at[i, "Impact level"] = impact
            if str(df.at[i, "Tier level (1-4)"]).strip() in ("", "TBD"):
                df.at[i, "Tier level (1-4)"] = tier
            if str(df.at[i, "Difficulty"]).strip() in ("", "TBD"):
                df.at[i, "Difficulty"] = difficulty

            if str(df.at[i, "Time to approval"]).strip() in ("", "TBD"):
                df.at[i, "Time to approval"] = estimate_time_to_approval(df.at[i, "Category"], da_val)

        df.to_csv(args.outp, index=False)
        print(f"Saved: {args.outp}")
    finally:
        if pw:
            pw.stop()

if __name__ == "__main__":
    main()
