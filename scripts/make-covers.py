#!/usr/bin/env python3
"""Generate a 1200x630 cover image for every perspective that has none.

Usage (from the repo root):
    python3 scripts/make-covers.py            # create missing covers, set "image" in content/perspectives.json
    python3 scripts/make-covers.py --force    # rebuild every generated cover

Then regenerate the pages and the public build:
    node scripts/generate-thesis-pages.js && node scripts/build-public.js

A post whose "image" already points to a file that is not a generated card
(a hand-made image) is left alone. Cards use the site palette: navy gradient,
gold rule, Playfair title, Inter labels. Needs Google Chrome and Pillow.
"""
import html
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'content', 'perspectives.json')
OUT = os.path.join(ROOT, 'images', 'covers')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
MARK = '.generated'  # names of generated cards are listed here so hand-made images are never overwritten

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{background:linear-gradient(135deg,#0F2A5F 0%,#0B1F4A 45%,#081532 100%);color:#fff;font-family:'Inter',sans-serif;position:relative}}
.glow{{position:absolute;right:-120px;top:-120px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(197,160,89,.16),rgba(197,160,89,0) 65%)}}
.wrap{{position:absolute;left:84px;right:84px;top:72px;bottom:64px;display:flex;flex-direction:column}}
.theme{{font-size:22px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C5A059}}
.title{{font-family:'Playfair Display',serif;font-weight:700;font-size:{size}px;line-height:1.18;margin-top:34px;color:#fff}}
.spacer{{flex:1}}
.rule{{width:84px;height:3px;background:#C5A059;margin-bottom:22px}}
.foot{{display:flex;justify-content:space-between;font-size:21px;letter-spacing:.14em;text-transform:uppercase;color:#C9D3E8}}
.foot b{{color:#fff;font-weight:600}}
</style></head><body><div class="glow"></div>
<div class="wrap"><div class="theme">{theme}</div><div class="title">{title}</div><div class="spacer"></div>
<div class="rule"></div><div class="foot"><span><b>Arif Padaria</b> &nbsp;|&nbsp; Faris Capital</span><span>{date}</span></div></div></body></html>"""


def font_size(title):
    n = len(title)
    if n <= 45:
        return 70
    if n <= 70:
        return 60
    if n <= 100:
        return 52
    return 44


def render(post, label, dest):
    page = TEMPLATE.format(size=font_size(post['title']), theme=html.escape(label),
                           title=html.escape(post['title']), date=html.escape(post['date'].upper()))
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'card.html')
        png = os.path.join(tmp, 'card.png')
        with open(src, 'w') as f:
            f.write(page)
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                        '--window-size=1200,630', '--virtual-time-budget=9000', f'--screenshot={png}',
                        'file://' + src], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        Image.open(png).convert('RGB').crop((0, 0, 1200, 630)).save(dest, 'JPEG', quality=86, optimize=True)


def main():
    force = '--force' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    marker = os.path.join(OUT, MARK)
    generated = set(open(marker).read().split()) if os.path.exists(marker) else set()
    with open(DATA) as f:
        db = json.load(f)
    made = 0
    for post in db['posts']:
        name = post['id'] + '.jpg'
        image = post.get('image')
        if image and os.path.basename(image) not in generated and os.path.exists(os.path.join(ROOT, image.lstrip('/'))):
            continue  # hand-made cover
        dest = os.path.join(OUT, name)
        if os.path.exists(dest) and not force and image:
            continue
        label = db['themes'].get(post.get('theme'), {}).get('label', 'Perspective')
        render(post, label, dest)
        generated.add(name)
        post['image'] = '/images/covers/' + name
        made += 1
        print('cover', name)
    with open(marker, 'w') as f:
        f.write('\n'.join(sorted(generated)) + '\n')
    with open(DATA, 'w') as f:
        f.write(json.dumps(db, indent=2, ensure_ascii=False) + '\n')
    print(f'{made} covers made')


if __name__ == '__main__':
    main()
