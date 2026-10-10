"""Rebuild climate facts from the dated EPA PDF (requires pdfplumber 0.11.4).
Usage: python scripts/import-btu-climate.py /path/to/climate.pdf
The source checksum and table layout are checked to prevent silent edition changes.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
import pdfplumber

source = Path(sys.argv[1])
checksum = hashlib.sha256(source.read_bytes()).hexdigest()
expected = '813bf5e7458985ece7ceb87594ecf7feabe764f8ba90b92760dbfa24428b7b16'
assert checksum == expected, 'Source checksum changed; review before updating the importer'
regions = {}
last_record = None
skipped = []
with pdfplumber.open(source) as pdf:
    assert len(pdf.pages) == 141, 'Review the new source edition before importing'
    for index in range(3, 141):
        page = pdf.pages[index]
        table = page.extract_tables()[0]
        for row in table:
            assert len(row) == 24, (index + 1, len(row))
            cells = [' '.join(' '.join(s.split()) for s in row[i:i+3] if s).strip().replace('\u0002', '-').replace('(cid:2)', '-') for i in range(0, 24, 3)]
            state, county, cooling, heating = cells[:4]
            if re.fullmatch(r'-?\d+', cooling) and re.fullmatch(r'-?\d+', heating):
                assert state and county, (index + 1, cells)
                assert 70 <= int(cooling) <= 130 and -70 <= int(heating) <= 85, cells
                last_record = [county, int(heating), int(cooling), index + 1]
                regions.setdefault(state, []).append(last_record)
            elif county and county != 'County':
                if not state and not cooling and not heating and last_record and last_record[3] == index + 1:
                    last_record[0] += ('' if last_record[0].endswith('-') else ' ') + county
                else:
                    skipped.append((index + 1, cells))
        page.close()
assert not skipped, skipped
for state, rows in regions.items():
    assert len(rows) == len({row[0] for row in rows}), state
    regions[state] = sorted(rows)
count = sum(map(len, regions.values()))
assert count > 3000, count
result = {
    'edition': '2019; revised 2020-11-11',
    'verifiedOn': '2026-10-10',
    'source': 'https://www.energystar.gov/sites/default/files/Design%20Temperature%20Limit%20Reference%20Guide%20%282019%20Ed%29%20-%20ENERGY%20STAR%20Single-Family%20New%20Homes_Rev11.pdf',
    'sourceSha256': checksum,
    'scope': 'EPA county/territory program temperature limits, not current weather or site-specific weather-station temperatures. Geographic names retain the source edition.',
    'columns': ['county', 'heating99F', 'cooling1F', 'pdfPage'],
    'count': count,
    'regions': regions,
}
# One record per line keeps numeric source reviews readable.
text = json.dumps({k:v for k,v in result.items() if k!='regions'}, indent=2, ensure_ascii=False)
text = text[:-2] + ',\n  "regions": {\n' + ',\n'.join('    '+json.dumps(state)+': [\n'+',\n'.join('      '+json.dumps(row,ensure_ascii=False) for row in rows)+'\n    ]' for state,rows in regions.items())+'\n  }\n}\n'
Path('src/data/btu-us-climate.json').write_text(text)
print(json.dumps({'rows':count,'regions':{k:len(v) for k,v in regions.items()},'sha256':checksum}, indent=2))
