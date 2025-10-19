#!/usr/bin/env python3
"""
Submission Mapper & Monitor Toolkit
===================================

This script maps business-directory submission forms and watches them for change.
It powers two workflows:

- ``map``: Capture each target once (DOM snapshot, screenshot, structured form map).
- ``monitor``: Rebuild the map, diff against the prior snapshot, and log CHANGE events.

Outputs live under the configured ``out`` directory (default: ``submission_monitor_toolkit/out``):

```
out/<site_id>/
  map.json
  map.html
  sshot.png
out/master_index.csv
out/events.csv
```
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd
from playwright.sync_api import (
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)

TOOL_VERSION = "1.0.0"
DEFAULT_TIMEOUT_MS = 25_000
DEFAULT_VIEWPORT = {"width": 1440, "height": 900}
DEFAULT_POST_LOAD_WAIT_MS = 1_000

MASTER_HEADERS = [
    "site_id",
    "homepage",
    "submission_url",
    "notes",
    "target_url",
    "resolved_url",
    "last_mode",
    "last_captured_at",
    "status",
    "last_error",
    "dom_checksum",
    "form_signature",
    "form_count",
    "field_count",
    "has_captcha",
    "likely_multi_step",
    "map_json",
    "map_html",
    "screenshot",
    "captured_with",
]

EVENT_HEADERS = [
    "timestamp",
    "site_id",
    "level",
    "change_type",
    "dom_checksum_prev",
    "dom_checksum_new",
    "form_signature_prev",
    "form_signature_new",
    "resolved_url_prev",
    "resolved_url_new",
    "details",
]

FORM_EXTRACTION_SCRIPT = """
() => {
  const toSelector = (el) => {
    if (!el || !el.nodeName) {
      return null;
    }
    if (el.id) {
      return `${el.nodeName.toLowerCase()}#${el.id}`;
    }
    const parts = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let part = current.nodeName.toLowerCase();
      if (current.classList && current.classList.length) {
        part += '.' + Array.from(current.classList).join('.');
      }
      if (current !== el) {
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(child => child.nodeName === current.nodeName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            part += `:nth-of-type(${index})`;
          }
        }
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  };

  const normaliseText = (input) => {
    if (!input) return '';
    return input.replace(/\\s+/g, ' ').trim();
  };

  const readLabels = (element) => {
    if (!element) return [];
    const labels = [];
    if (element.labels && element.labels.length) {
      element.labels.forEach(label => labels.push(normaliseText(label.innerText || label.textContent || '')));
    }
    const describedBy = element.getAttribute && element.getAttribute('aria-describedby');
    if (describedBy) {
      describedBy.split(' ').forEach(id => {
        const descEl = document.getElementById(id);
        if (descEl) {
          labels.push(normaliseText(descEl.innerText || descEl.textContent || ''));
        }
      });
    }
    const ariaLabel = element.getAttribute && element.getAttribute('aria-label');
    if (ariaLabel) {
      labels.push(normaliseText(ariaLabel));
    }
    return labels.filter(text => text.length);
  };

  const forms = Array.from(document.forms || []);
  return forms.map((form, index) => {
    const fields = Array.from(form.elements || []).map(el => {
      const tag = el.tagName ? el.tagName.toLowerCase() : null;
      const inputType = el.getAttribute && el.getAttribute('type');
      return {
        name: el.name || null,
        id: el.id || null,
        tag,
        type: inputType ? inputType.toLowerCase() : (tag === 'input' ? 'text' : null),
        required: el.required === true,
        placeholder: el.placeholder || null,
        labels: readLabels(el),
        ariaRequired: el.getAttribute && el.getAttribute('aria-required'),
        autocomplete: el.getAttribute && el.getAttribute('autocomplete'),
      };
    });

    const submitCandidates = Array.from(
      form.querySelectorAll('button, input[type=\"submit\"], input[type=\"button\"], a[role=\"button\"]')
    ).map(el => ({
      selector: toSelector(el),
      text: normaliseText(el.innerText || el.textContent || el.value || ''),
      type: (el.getAttribute && el.getAttribute('type')) ? el.getAttribute('type').toLowerCase() : el.tagName.toLowerCase(),
    }));

    return {
      index,
      action: form.getAttribute('action'),
      method: (form.getAttribute('method') || 'get').toLowerCase(),
      dataset: Object.assign({}, form.dataset || {}),
      fields,
      submitters: submitCandidates,
    };
  });
}
"""


@dataclass
class Target:
    site_id: str
    homepage: str
    submission_url: Optional[str]
    notes: str
    raw_site_id: str

    @property
    def target_url(self) -> Optional[str]:
        url = self.submission_url or self.homepage
        return url if url else None


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_text(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def sanitize_site_id(raw_value: str) -> str:
    value = "".join(ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in raw_value.lower())
    value = value.strip("-_")
    while "--" in value:
        value = value.replace("--", "-")
    return value or "site"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def append_csv_row(path: Path, headers: List[str], row: Dict[str, Any]) -> None:
    file_exists = path.exists()
    with path.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        if not file_exists:
            writer.writeheader()
        writer.writerow({key: row.get(key, "") for key in headers})


def compute_form_signature(forms: Iterable[Dict[str, Any]]) -> str:
    canonical = json.dumps(list(forms), sort_keys=True, ensure_ascii=False)
    return sha256_text(canonical)


def infer_multi_step(forms: List[Dict[str, Any]], dom_html: str) -> Dict[str, Any]:
    html_lower = (dom_html or "").lower()
    signals: List[str] = []

    if "data-step" in html_lower:
        signals.append("dom:data-step")
    if "form-step" in html_lower:
        signals.append("dom:form-step")
    if "wizard" in html_lower:
        signals.append("dom:wizard-keyword")
    if "progressbar" in html_lower:
        signals.append("dom:progressbar")

    for form in forms:
        dataset = form.get("dataset") or {}
        for key, value in dataset.items():
            joined = f"{key}={value}" if value is not None else key
            if "step" in key.lower() or (isinstance(value, str) and "step" in value.lower()):
                signals.append(f"form-dataset:{joined}")
        for submit in form.get("submitters", []):
            text = (submit.get("text") or "").lower()
            if any(term in text for term in ("next", "continue", "step", "proceed", "save & next")):
                if text:
                    signals.append(f"submit-text:{text}")

    if len(forms) > 1:
        signals.append("multiple-forms-on-page")

    unique_signals = sorted(set(signals))
    return {"likely": bool(unique_signals), "signals": unique_signals}


def detect_captcha(page, dom_html: str) -> bool:
    dom_lower = (dom_html or "").lower()
    keywords = ("captcha", "recaptcha", "hcaptcha", "arkose")
    if any(keyword in dom_lower for keyword in keywords):
        return True

    selectors = [
        "iframe[src*='recaptcha']",
        ".g-recaptcha",
        ".grecaptcha-badge",
        "iframe[src*='hcaptcha']",
        ".h-captcha",
        "div[id*='captcha']",
        "iframe[src*='arkoselabs']",
    ]
    try:
        for selector in selectors:
            if page.locator(selector).count():
                return True
    except PlaywrightError:
        return False
    return False


def load_targets(path: Path) -> List[Target]:
    if not path.exists():
        raise FileNotFoundError(f"Targets CSV not found: {path}")

    df = pd.read_csv(path)
    required = {"site_id", "homepage", "submission_url", "notes"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Targets CSV missing required columns: {', '.join(sorted(missing))}")

    targets: List[Target] = []
    for idx, row in df.iterrows():
        raw_id = str(row["site_id"]).strip() if not pd.isna(row["site_id"]) else ""
        if not raw_id:
            raise ValueError(f"Row {idx + 1}: site_id is required")
        site_id = sanitize_site_id(raw_id)
        homepage = "" if pd.isna(row["homepage"]) else str(row["homepage"]).strip()
        submission_url = "" if pd.isna(row["submission_url"]) else str(row["submission_url"]).strip()
        notes = "" if pd.isna(row["notes"]) else str(row["notes"]).strip()
        targets.append(
            Target(
                site_id=site_id,
                homepage=homepage,
                submission_url=submission_url or None,
                notes=notes,
                raw_site_id=raw_id,
            )
        )
    return targets


def compare_maps(previous: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
    changes: List[str] = []
    if previous.get("dom_checksum") != current.get("dom_checksum"):
        changes.append("DOM")
    if previous.get("form_signature") != current.get("form_signature"):
        changes.append("FORMS")
    if previous.get("has_captcha") != current.get("has_captcha"):
        changes.append("CAPTCHA")
    if previous.get("likely_multi_step") != current.get("likely_multi_step"):
        changes.append("STEP_HINT")
    if (previous.get("resolved_url") or "") != (current.get("resolved_url") or ""):
        changes.append("URL")

    return {
        "changed": bool(changes),
        "change_types": changes,
    }


class SubmissionMapperMonitor:
    def __init__(
        self,
        out_dir: Path,
        *,
        headless: bool = True,
        slow_mo: int = 0,
        timeout_ms: int = DEFAULT_TIMEOUT_MS,
        post_load_wait_ms: int = DEFAULT_POST_LOAD_WAIT_MS,
        viewport: Optional[Dict[str, int]] = None,
        logger: Optional[logging.Logger] = None,
    ) -> None:
        self.out_dir = out_dir.resolve()
        self.headless = headless
        self.slow_mo = slow_mo
        self.timeout = timeout_ms
        self.post_load_wait_ms = post_load_wait_ms
        self.viewport = viewport or DEFAULT_VIEWPORT
        self.logger = logger or logging.getLogger("submission_mapper_monitor")
        ensure_dir(self.out_dir)

    def map_targets(self, targets: List[Target], limit: Optional[int] = None) -> None:
        self._run(mode="map", targets=targets, limit=limit)

    def monitor_targets(self, targets: List[Target], limit: Optional[int] = None) -> None:
        self._run(mode="monitor", targets=targets, limit=limit)

    def _run(self, mode: str, targets: List[Target], limit: Optional[int]) -> None:
        processed = 0
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=self.headless, slow_mo=self.slow_mo or None)
            try:
                for target in targets:
                    if limit is not None and processed >= limit:
                        break
                    processed += 1
                    self._process_single_target(browser, target, mode)
            finally:
                browser.close()

    def _process_single_target(self, browser, target: Target, mode: str) -> None:
        site_dir = self.out_dir / target.site_id
        ensure_dir(site_dir)

        previous_map = self._load_existing_map(site_dir / "map.json")
        if mode == "monitor" and previous_map is None:
            self.logger.info("No prior map found for %s; capturing baseline.", target.site_id)

        context = browser.new_context(ignore_https_errors=True, viewport=self.viewport)
        page = context.new_page()
        try:
            capture = self._capture_target(page, target, site_dir, mode)
        finally:
            page.close()
            context.close()

        self._write_map_json(site_dir / "map.json", capture)
        self._record_master_index(capture)

        if mode == "monitor" and previous_map:
            diff = compare_maps(previous_map, capture)
            if diff["changed"]:
                self._log_change_event(previous_map, capture, diff["change_types"])
                self.logger.warning(
                    "Change detected for %s -> %s",
                    target.site_id,
                    ", ".join(diff["change_types"]),
                )
            else:
                self.logger.info("No change detected for %s", target.site_id)

    def _capture_target(
        self,
        page,
        target: Target,
        site_dir: Path,
        mode: str,
    ) -> Dict[str, Any]:
        timestamp = utc_now_iso()
        map_html_path = site_dir / "map.html"
        screenshot_path = site_dir / "sshot.png"

        payload: Dict[str, Any] = {
            "tool_version": TOOL_VERSION,
            "site_id": target.site_id,
            "raw_site_id": target.raw_site_id,
            "homepage": target.homepage,
            "submission_url": target.submission_url,
            "target_url": target.target_url,
            "resolved_url": None,
            "captured_at": timestamp,
            "mode": mode,
            "status": "error",
            "error": None,
            "dom_checksum": None,
            "form_signature": None,
            "form_count": 0,
            "field_count": 0,
            "has_captcha": False,
            "multi_step_signal": {"likely": False, "signals": []},
            "likely_multi_step": False,
            "forms": [],
            "submitters": [],
            "notes": target.notes,
            "artifacts": {
                "map_html": str(map_html_path.relative_to(self.out_dir)),
                "screenshot": str(screenshot_path.relative_to(self.out_dir)),
                "map_json": str((site_dir / "map.json").relative_to(self.out_dir)),
            },
            "load_duration_ms": None,
        }

        target_url = target.target_url
        if not target_url:
            payload["error"] = "Missing submission_url and homepage; nothing to capture."
            self.logger.error("Skipping %s: %s", target.site_id, payload["error"])
            return payload

        nav_start = time.perf_counter()
        try:
            page.set_default_timeout(self.timeout)
            response = page.goto(target_url, wait_until="networkidle")
            payload["resolved_url"] = page.url
            if response is not None:
                payload["status_code"] = response.status
            page.wait_for_timeout(self.post_load_wait_ms)
            html = page.content()
            map_html_path.write_text(html, encoding="utf-8")
            try:
                page.screenshot(path=str(screenshot_path), full_page=False)
            except PlaywrightError as screenshot_error:
                self.logger.warning("Screenshot failed for %s: %s", target.site_id, screenshot_error)
            forms = page.evaluate(FORM_EXTRACTION_SCRIPT)
            if not isinstance(forms, list):
                forms = []
            has_captcha = detect_captcha(page, html)
            multi_step = infer_multi_step(forms, html)
            form_signature = compute_form_signature(forms)
            dom_checksum = sha256_text(html)
            submitters = sorted(
                {submit.get("selector") for form in forms for submit in form.get("submitters", []) if submit.get("selector")}
            )
            field_count = sum(len(form.get("fields", [])) for form in forms)

            payload.update(
                {
                    "status": "ok",
                    "error": None,
                    "dom_checksum": dom_checksum,
                    "form_signature": form_signature,
                    "form_count": len(forms),
                    "field_count": field_count,
                    "forms": forms,
                    "submitters": submitters,
                    "has_captcha": has_captcha,
                    "multi_step_signal": multi_step,
                    "likely_multi_step": bool(multi_step.get("likely")),
                }
            )
        except PlaywrightTimeoutError as exc:
            payload["error"] = f"Navigation timeout after {self.timeout} ms: {exc}"
            self.logger.error("Timeout capturing %s: %s", target.site_id, exc)
        except PlaywrightError as exc:
            payload["error"] = f"Playwright error: {exc}"
            self.logger.error("Playwright error capturing %s: %s", target.site_id, exc)
        except Exception as exc:  # pylint: disable=broad-except
            payload["error"] = f"Unexpected error: {exc}"
            self.logger.exception("Unexpected error capturing %s", target.site_id)
        finally:
            payload["load_duration_ms"] = int((time.perf_counter() - nav_start) * 1_000)

        return payload

    def _load_existing_map(self, map_path: Path) -> Optional[Dict[str, Any]]:
        if not map_path.exists():
            return None
        try:
            return json.loads(map_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self.logger.warning("Existing map.json could not be parsed: %s", map_path)
            return None

    def _write_map_json(self, map_path: Path, payload: Dict[str, Any]) -> None:
        map_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    def _record_master_index(self, capture: Dict[str, Any]) -> None:
        master_path = self.out_dir / "master_index.csv"
        ensure_dir(master_path.parent)
        row = {
            "site_id": capture.get("site_id"),
            "homepage": capture.get("homepage") or "",
            "submission_url": capture.get("submission_url") or "",
            "notes": capture.get("notes") or "",
            "target_url": capture.get("target_url") or "",
            "resolved_url": capture.get("resolved_url") or "",
            "last_mode": capture.get("mode") or "",
            "last_captured_at": capture.get("captured_at") or "",
            "status": capture.get("status") or "error",
            "last_error": capture.get("error") or "",
            "dom_checksum": capture.get("dom_checksum") or "",
            "form_signature": capture.get("form_signature") or "",
            "form_count": capture.get("form_count") or 0,
            "field_count": capture.get("field_count") or 0,
            "has_captcha": capture.get("has_captcha"),
            "likely_multi_step": capture.get("likely_multi_step"),
            "map_json": capture.get("artifacts", {}).get("map_json", ""),
            "map_html": capture.get("artifacts", {}).get("map_html", ""),
            "screenshot": capture.get("artifacts", {}).get("screenshot", ""),
            "captured_with": TOOL_VERSION,
        }

        if master_path.exists():
            df = pd.read_csv(master_path)
            mask = df["site_id"] == row["site_id"]
            if mask.any():
                df.loc[mask, MASTER_HEADERS] = [row.get(col) for col in MASTER_HEADERS]
            else:
                df.loc[len(df)] = [row.get(col) for col in MASTER_HEADERS]
        else:
            df = pd.DataFrame(columns=MASTER_HEADERS)
            df.loc[len(df)] = [row.get(col) for col in MASTER_HEADERS]

        df.to_csv(master_path, index=False)

    def _log_change_event(
        self,
        previous: Dict[str, Any],
        current: Dict[str, Any],
        change_types: List[str],
    ) -> None:
        events_path = self.out_dir / "events.csv"
        details = "; ".join(sorted(change_types))
        event_row = {
            "timestamp": current.get("captured_at") or utc_now_iso(),
            "site_id": current.get("site_id"),
            "level": "CHANGE",
            "change_type": ",".join(change_types),
            "dom_checksum_prev": previous.get("dom_checksum") or "",
            "dom_checksum_new": current.get("dom_checksum") or "",
            "form_signature_prev": previous.get("form_signature") or "",
            "form_signature_new": current.get("form_signature") or "",
            "resolved_url_prev": previous.get("resolved_url") or "",
            "resolved_url_new": current.get("resolved_url") or "",
            "details": details,
        }
        append_csv_row(events_path, EVENT_HEADERS, event_row)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Map and monitor directory submission forms.")
    parser.add_argument(
        "--out-dir",
        default=Path(__file__).resolve().parent / "out",
        type=Path,
        help="Directory for generated artifacts (default: %(default)s)",
    )
    parser.add_argument(
        "--headless",
        dest="headless",
        action="store_true",
        help="Run the browser in headless mode (default).",
    )
    parser.add_argument(
        "--no-headless",
        dest="headless",
        action="store_false",
        help="Run the browser with a visible window.",
    )
    parser.set_defaults(headless=True)
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT_MS,
        help="Navigation timeout in milliseconds (default: %(default)s).",
    )
    parser.add_argument(
        "--slowmo",
        type=int,
        default=0,
        help="Playwright slow motion in milliseconds between actions (default: %(default)s).",
    )
    parser.add_argument(
        "--post-load-wait",
        type=int,
        default=DEFAULT_POST_LOAD_WAIT_MS,
        help="Additional wait after navigation completes (ms).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process only the first N targets (useful for smoke tests).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"],
        help="Logging verbosity (default: %(default)s).",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_common_subparser(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument(
            "--targets",
            required=True,
            type=Path,
            help="CSV file with site_id, homepage, submission_url, notes.",
        )

    map_parser = subparsers.add_parser("map", help="Capture submission artifacts for all targets.")
    add_common_subparser(map_parser)

    monitor_parser = subparsers.add_parser(
        "monitor",
        help="Rebuild maps, diff against previous snapshots, and log changes.",
    )
    add_common_subparser(monitor_parser)

    return parser.parse_args(argv)


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level),
        format="%(asctime)s | %(levelname)-8s | %(message)s",
    )


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    configure_logging(args.log_level)

    logger = logging.getLogger("submission_mapper_monitor")
    try:
        targets = load_targets(Path(args.targets))
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Failed to load targets: %s", exc)
        return 1

    runner = SubmissionMapperMonitor(
        out_dir=args.out_dir,
        headless=args.headless,
        slow_mo=args.slowmo,
        timeout_ms=args.timeout,
        post_load_wait_ms=args.post_load_wait,
        logger=logger,
    )

    limit = args.limit

    if args.command == "map":
        logger.info("Starting initial mapping for %d targets.", len(targets) if limit is None else min(limit, len(targets)))
        runner.map_targets(targets, limit=limit)
    elif args.command == "monitor":
        logger.info("Starting monitoring pass for %d targets.", len(targets) if limit is None else min(limit, len(targets)))
        runner.monitor_targets(targets, limit=limit)
    else:
        logger.error("Unknown command: %s", args.command)
        return 1

    logger.info("All done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())




