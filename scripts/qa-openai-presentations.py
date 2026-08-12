from argparse import ArgumentParser
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat
import hashlib
import json
import math

ROOT = Path(__file__).resolve().parents[1]

parser = ArgumentParser()
parser.add_argument("--manifest", default="assets/openai-art-manifest.json")
parser.add_argument("--out", default=".openai-art-work/qa/presentations")
args = parser.parse_args()

manifest_path = (ROOT / args.manifest).resolve()
out_dir = (ROOT / args.out).resolve()
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
entries = manifest.get("apps", [])
if len(entries) != 118 or len({entry.get("id") for entry in entries}) != 118:
    raise RuntimeError("OpenAI manifest must contain 118 unique applications")

out_dir.mkdir(parents=True, exist_ok=True)
font = ImageFont.load_default()
records = []
hashes = {}

def dhash(image):
    gray = image.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    pixels = list(gray.get_flattened_data())
    bits = 0
    for row in range(8):
        for column in range(8):
            bits = (bits << 1) | (pixels[row * 9 + column] > pixels[row * 9 + column + 1])
    return bits

for entry in entries:
    relative = Path(entry["asset"])
    asset = (ROOT / relative).resolve()
    if ROOT not in asset.parents or relative.parts[:2] != ("assets", "presentations"):
        raise RuntimeError(f"Unsafe presentation path: {relative}")
    blob = asset.read_bytes()
    digest = hashlib.sha256(blob).hexdigest()
    if digest != entry["sha256"]:
        raise RuntimeError(f"SHA-256 mismatch: {entry['id']}")
    with Image.open(asset) as source:
        source.verify()
    with Image.open(asset) as source:
        image = source.convert("RGB")
        image.load()
    width, height = image.size
    stats = ImageStat.Stat(image.convert("L"))
    mean = stats.mean[0]
    deviation = stats.stddev[0]
    flags = []
    if width < 1280 or height < 720:
        flags.append("low-resolution")
    ratio = width / height
    if not 1.74 <= ratio <= 1.82:
        flags.append("non-16x9")
    if len(blob) < 20_000:
        flags.append("small-file")
    if mean < 8 and deviation < 3:
        flags.append("near-black")
    signature = dhash(image)
    records.append({
        "id": entry["id"],
        "asset": entry["asset"],
        "width": width,
        "height": height,
        "bytes": len(blob),
        "sha256": digest,
        "meanLuminance": round(mean, 2),
        "stddevLuminance": round(deviation, 2),
        "dhash": f"{signature:016x}",
        "flags": flags,
        "humanReview": "pending"
    })
    hashes[entry["id"]] = signature

for index, record in enumerate(records):
    for other in records[:index]:
        distance = (hashes[record["id"]] ^ hashes[other["id"]]).bit_count()
        if distance <= 4:
            record["flags"].append(f"near-duplicate:{other['id']}:{distance}")
            other["flags"].append(f"near-duplicate:{record['id']}:{distance}")

for sheet_index in range(math.ceil(len(records) / 25)):
    chunk = records[sheet_index * 25:(sheet_index + 1) * 25]
    sheet = Image.new("RGB", (5 * 420, 5 * 255), "#11141a")
    draw = ImageDraw.Draw(sheet)
    for position, record in enumerate(chunk):
        column, row = position % 5, position // 5
        x, y = column * 420 + 10, row * 255 + 10
        with Image.open(ROOT / record["asset"]) as source:
            thumb = ImageOps.contain(source.convert("RGB"), (400, 225), Image.Resampling.LANCZOS)
        tile = Image.new("RGB", (400, 225), "black")
        tile.paste(thumb, ((400 - thumb.width) // 2, (225 - thumb.height) // 2))
        sheet.paste(tile, (x, y))
        outline = "#ff4d5a" if record["flags"] else "#4ed39b"
        draw.rectangle((x, y, x + 399, y + 224), outline=outline, width=3)
        draw.text((x, y + 230), record["id"][:52], fill="white", font=font)
    sheet.save(out_dir / f"contact-sheet-{sheet_index + 1}.png", optimize=True)

report = {
    "manifest": args.manifest,
    "count": len(records),
    "flagged": sum(bool(record["flags"]) for record in records),
    "records": records
}
(out_dir / "qa-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"count": report["count"], "flagged": report["flagged"], "sheets": math.ceil(len(records) / 25)}))
