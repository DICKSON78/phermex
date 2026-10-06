#!/usr/bin/env python3
"""Regenerate the Helix launcher icons from the flat brand mark.

Source: brand/helix_logo_new.png (transparent background).
Composition: the mark centred on white, sized for each density and for the
adaptive-icon safe zone (66/108 of the foreground canvas).
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tool', 'brand', 'helix_logo_new.png')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
STORE = os.path.join(ROOT, 'tool', 'brand', 'store-icon-512.png')

WHITE = (255, 255, 255, 255)

LEGACY = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
FOREGROUND = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}


def mark(width, height):
    im = Image.open(SRC).convert('RGBA')
    bbox = im.getbbox()  # trim the transparent frame
    im = im.crop(bbox)
    im.thumbnail((width, height), Image.LANCZOS)
    canvas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    canvas.paste(im, ((width - im.width) // 2, (height - im.height) // 2), im)
    return canvas


for density, size in FOREGROUND.items():
    # 66/108 safe zone: the visible logo should not exceed 61% of the canvas.
    fg = mark(int(size * 0.61), int(size * 0.61))
    out = os.path.join(RES, f'mipmap-{density}', 'ic_launcher_foreground.png')
    fg.save(out)
    print('foreground', density, size, '->', out, fg.size)

for density, size in LEGACY.items():
    legacy = Image.new('RGBA', (size, size), WHITE)
    m = mark(int(size * 0.78), int(size * 0.78))
    legacy.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    out = os.path.join(RES, f'mipmap-{density}', 'ic_launcher.png')
    legacy.convert('RGB').save(out)
    print('legacy', density, size, '->', out)

# Play Store app icon: 512x512, opaque white, mark at ~76%.
store = Image.new('RGBA', (512, 512), WHITE)
m = mark(int(512 * 0.76), int(512 * 0.76))
store.paste(m, ((512 - m.width) // 2, (512 - m.height) // 2), m)
store.convert('RGB').save(STORE)
print('store ->', STORE)