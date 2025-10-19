# Directory Metrics Auto-Fill (v1)

This package contains:
- `directories_autocategorized_v0.csv` — your original data with **Category** pre-filled using heuristics and other columns set to `TBD`.
- `directories_autocategorized_v0.xlsx` — same data in Excel.
- `fill_directory_metrics.py` — a ready-to-run script to auto-fill **Domain authority**, **Traffic estimate**, **Has captcha (y/n)**, and compute **Impact level**, **Tier**, **Difficulty**, and **Time to approval** estimates.

## Quick Start
1. **Download** all three files.
2. **Install dependencies** on your machine (Python 3.10+):
   ```bash
   pip install playwright python-dotenv requests pandas openpyxl
   python -m playwright install
   ```
3. **Create a `.env`** file next to the script with your keys (free plans are okay to start):
   ```bash
   MOZ_ACCESS_ID=your_moz_access_id
   MOZ_SECRET_KEY=your_moz_secret_key
   SIMILARWEB_API_KEY=your_similarweb_api_key
   ```
4. **Run the script**:
   ```bash
   python fill_directory_metrics.py --in "directories_autocategorized_v0.csv" --out "directories_filled.csv"
   ```
5. **Result**: `directories_filled.csv` will have the metrics filled where data was available. Re-run is safe; it only fills empty/TBD cells.

## Notes
- **Category**: pre-filled via keyword heuristics; you can tweak later.
- **Domain Authority**: fetched via Moz (or adjust to Ahrefs DR if you prefer).
- **Traffic estimate**: fetched via Similarweb API; free keys may limit accuracy.
- **Has captcha**: detected by loading the page with Playwright and scanning for captcha widgets.
- **Impact/Tier/Difficulty**: computed from DA and Traffic with transparent rules in the script.
- **Time to approval**: rule-of-thumb estimate based on category and DA.
