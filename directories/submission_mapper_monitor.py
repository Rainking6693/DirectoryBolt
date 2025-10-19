# submission_mapper_monitor.py
# Maps submission processes for directories and monitors for changes.
# This script requires Playwright; run locally with internet access.
from __future__ import annotations

import os, sys, re, hashlib, json, csv, argparse, datetime as dt
from urllib.parse import urlparse
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('Playwright is required. Install with: pip install playwright && python -m playwright install', file=sys.stderr)
    raise

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, 'out')
os.makedirs(OUT_DIR, exist_ok=True)

def normalize_domain(url: str) -> str:
    try:
        u = urlparse(url)
        host = (u.hostname or '').lower()
        return re.sub(r'^www\.', '', host)
    except Exception:
        return ''

def read_targets(path: str):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        rdr = csv.DictReader(f)
        for r in rdr:
            rows.append(r)
    return rows

def ensure_site_dir(site_id: str) -> str:
    d = os.path.join(OUT_DIR, site_id)
    os.makedirs(d, exist_ok=True)
    return d

def write_json(path: str, data: Any) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def map_submission_page(site_id: str, url: str, headless: bool=True, timeout_ms: int=30000):
    site_dir = ensure_site_dir(site_id)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page(viewport={'width': 1366, 'height': 900})
        page.goto(url, timeout=timeout_ms, wait_until='domcontentloaded')

        html = page.content()
        title = page.title() or ''
        captcha_present = bool(re.search(r'(g-recaptcha|hcaptcha|data-sitekey|captcha)', html, re.I))

        forms = []
        form_handles = page.query_selector_all('form')
        for idx, fh in enumerate(form_handles):
            form_selector = f'form:nth-of-type({idx+1})'
            action = fh.get_attribute('action') or ''
            method = (fh.get_attribute('method') or 'GET').upper()

            field_specs = []
            inputs = fh.query_selector_all('input, textarea, select')
            for ih in inputs:
                tag = ih.evaluate('el => el.tagName.toLowerCase()')
                itype = ih.get_attribute('type') or ('select' if tag=='select' else 'text')
                name = ih.get_attribute('name') or ''
                required = ih.evaluate('el => el.required === true')
                placeholder = ih.get_attribute('placeholder') or ''

                label_text = ''
                aria = ih.get_attribute('aria-labelledby') or ''
                if aria:
                    for lid in aria.split():
                        lbl = page.query_selector(f'#{lid}')
                        if lbl:
                            label_text = (lbl.inner_text() or '').strip()
                            if label_text: break
                if not label_text:
                    parent_label = ih.evaluate_handle('el => el.closest("label")')
                    try:
                        if parent_label:
                            txt = parent_label.evaluate('el => el.innerText || ""')
                            label_text = (txt or '').strip()
                    except Exception:
                        pass
                if not label_text:
                    id_attr = ih.get_attribute('id') or ''
                    if id_attr:
                        lbl = page.query_selector(f'label[for="{id_attr}"]')
                        if lbl:
                            label_text = (lbl.inner_text() or '').strip()

                selector = ih.evaluate('''el => {
                    function cssPath(el){
                      if (!(el instanceof Element)) return '';
                      const path = [];
                      while (el && el.nodeType === Node.ELEMENT_NODE) {
                        let selector = el.nodeName.toLowerCase();
                        if (el.id) { selector += '#' + el.id; path.unshift(selector); break; }
                        else {
                          let sib = el, nth = 1;
                          while (sib = sib.previousElementSibling) { if (sib.nodeName.toLowerCase() === selector) nth++; }
                          selector += ":nth-of-type(" + nth + ")";
                        }
                        path.unshift(selector); el = el.parentNode;
                      }
                      return path.join(' > ');
                    }
                    return cssPath(el);
                }''')

                field_specs.append({
                    'name': name,
                    'type': itype,
                    'required': bool(required),
                    'label': label_text,
                    'placeholder': placeholder,
                    'selector': selector
                })

            submits = fh.query_selector_all('button[type="submit"], input[type="submit"]')
            submit_sels = []
            for sb in submits:
                sub_sel = sb.evaluate('''el => {
                    function cssPath(el){
                      if (!(el instanceof Element)) return '';
                      const path = [];
                      while (el && el.nodeType === Node.ELEMENT_NODE) {
                        let selector = el.nodeName.toLowerCase();
                        if (el.id) { selector += '#' + el.id; path.unshift(selector); break; }
                        else {
                          let sib = el, nth = 1;
                          while (sib = sib.previousElementSibling) { if (sib.nodeName.toLowerCase() === selector) nth++; }
                          selector += ":nth-of-type(" + nth + ")";
                        }
                        path.unshift(selector); el = el.parentNode;
                      }
                      return path.join(' > ');
                    }
                    return cssPath(el);
                }''')
                submit_sels.append(sub_sel)

            multi_step = 0
            if re.search(r'\b(next|continue|step\s*\d+|progress|wizard)\b', html, re.I):
                multi_step = 2

            forms.append({
                'form_selector': form_selector,
                'action': action,
                'method': method,
                'fields': field_specs,
                'submit_buttons': submit_sels,
                'captcha_present': captcha_present,
                'steps_detected': multi_step
            })

        sshot_path = os.path.join(ensure_site_dir(site_id), 'sshot.png')
        page.screenshot(path=sshot_path, full_page=False)
        dom = page.content().encode('utf-8')
        dom_sha = hashlib.sha256(dom).hexdigest()
        map_html_path = os.path.join(ensure_site_dir(site_id), 'map.html')
        with open(map_html_path, 'wb') as fh:
            fh.write(dom)
        browser.close()

        page_map = {
            'site_id': site_id,
            'url': url,
            'title': title,
            'forms': forms,
            'meta': {
                'hostname': normalize_domain(url),
                'captured_at': dt.datetime.utcnow().isoformat() + 'Z'
            },
            'dom_sha256': dom_sha,
            'screenshot_path': sshot_path
        }
        return page_map

def persist_map(pm):
    site_dir = ensure_site_dir(pm['site_id'])
    json_path = os.path.join(site_dir, 'map.json')
    write_json(json_path, pm)

    idx_path = os.path.join(OUT_DIR, 'master_index.csv')
    row = {
        'site_id': pm['site_id'],
        'url': pm['url'],
        'title': pm['title'],
        'hostname': pm['meta'].get('hostname',''),
        'dom_sha256': pm['dom_sha256'],
        'forms_count': len(pm['forms']),
        'fields_total': sum(len(f['fields']) for f in pm['forms']),
        'captcha_present': any(f['captcha_present'] for f in pm['forms']),
        'captured_at': pm['meta'].get('captured_at',''),
        'screenshot_path': pm['screenshot_path']
    }
    exists = os.path.exists(idx_path)
    with open(idx_path, 'a', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(row.keys()))
        if not exists:
            w.writeheader()
        w.writerow(row)

def log_event(site_id: str, level: str, message: str, extra=None) -> None:
    ev_path = os.path.join(OUT_DIR, 'events.csv')
    exists = os.path.exists(ev_path)
    row = {
        'ts': dt.datetime.utcnow().isoformat()+'Z',
        'site_id': site_id,
        'level': level,
        'message': message,
        'extra': json.dumps(extra or {}, ensure_ascii=False)
    }
    with open(ev_path, 'a', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(row.keys()))
        if not exists:
            w.writeheader()
        w.writerow(row)

def monitor_once(site_id: str, url: str):
    site_dir = ensure_site_dir(site_id)
    prev_json = os.path.join(site_dir, 'map.json')
    if not os.path.exists(prev_json):
        pm = map_submission_page(site_id, url)
        persist_map(pm)
        log_event(site_id, 'INFO', 'Initial map created')
        return

    with open(prev_json, 'r', encoding='utf-8') as f:
        old = json.load(f)

    pm = map_submission_page(site_id, url)
    persist_map(pm)

    if pm['dom_sha256'] != old.get('dom_sha256'):
        log_event(site_id, 'CHANGE', 'DOM hash changed', {'old': old.get('dom_sha256'), 'new': pm['dom_sha256']})

    def summarize(forms):
        out = []
        for f in forms:
            out.append({
                'form_selector': f.get('form_selector',''),
                'action': f.get('action',''),
                'method': f.get('method',''),
                'fields': [ {'name':x.get('name',''), 'type':x.get('type',''), 'required':bool(x.get('required',False)), 'label':x.get('label','')} for x in f.get('fields',[]) ],
                'captcha_present': bool(f.get('captcha_present', False)),
                'steps_detected': int(f.get('steps_detected', 0))
            })
        return out

    old_sum = summarize(old.get('forms',[]))
    new_sum = summarize(pm.get('forms',[]))

    def to_hash(obj):
        return hashlib.sha256(json.dumps(obj, sort_keys=True).encode('utf-8')).hexdigest()
    if to_hash(old_sum) != to_hash(new_sum):
        log_event(site_id, 'CHANGE', 'Form structure changed', {'before': old_sum, 'after': new_sum})

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['map','monitor'], help='map: build initial maps | monitor: diff against previous')
    ap.add_argument('--targets', required=True, help='CSV with site_id,homepage,submission_url')
    ap.add_argument('--headful', action='store_true', help='Show browser for debugging')
    args = ap.parse_args()

    targets = read_targets(args.targets)
    urls = []
    for t in targets:
        site_id = t.get('site_id') or t.get('id') or t.get('name')
        url = t.get('submission_url') or t.get('url') or t.get('homepage')
        if not site_id or not url:
            print(f'Skipping invalid row: {t}')
            continue
        urls.append((site_id.strip(), url.strip()))

    os.makedirs(OUT_DIR, exist_ok=True)

    if args.mode == 'map':
        for sid, url in urls:
            try:
                pm = map_submission_page(sid, url, headless=(not args.headful))
                persist_map(pm)
                print(f'[OK] {sid} -> {url}')
            except Exception as e:
                log_event(sid, 'ERROR', 'Mapping failed', {'error': str(e), 'url': url})
                print(f'[ERR] {sid} -> {e}')
    else:
        for sid, url in urls:
            try:
                monitor_once(sid, url)
                print(f'[OK] Monitored {sid}')
            except Exception as e:
                log_event(sid, 'ERROR', 'Monitor failed', {'error': str(e), 'url': url})
                print(f'[ERR] {sid} -> {e}')

if __name__ == '__main__':
    main()
