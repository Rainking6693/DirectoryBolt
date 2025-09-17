from pathlib import Path
lines = Path('client/src/pages/AiVsHumanNaming.js').read_text(encoding='utf-8').splitlines()
Path('analysis.txt').write_text(repr(lines[602]), encoding='utf-8')
