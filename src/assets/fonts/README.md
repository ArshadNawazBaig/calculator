# Bundled site fonts

These are the existing Finflo font families, served with `next/font/local` so
development and production builds do not need access to Google Fonts.

The WOFF2 files were converted losslessly from the full variable TTFs in the
official [Google Fonts repository](https://github.com/google/fonts). All glyphs
and variation axes are retained, including Latin characters in the Noto fonts.
Noto's default width remains 100%. Each font's complete SIL Open Font License
and copyright notice is included beside it.

| File | Upstream source | TTF SHA-256 |
| --- | --- | --- |
| `manrope-variable.woff2` | [Manrope](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf) | `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6` |
| `noto-sans-arabic-variable.woff2` | [Noto Sans Arabic](https://raw.githubusercontent.com/google/fonts/main/ofl/notosansarabic/NotoSansArabic%5Bwdth,wght%5D.ttf) | `63111b5b2e074dd48cc67692e0a2726d86ee94c1c37fe8598257b7b4e87e869e` |
| `noto-sans-devanagari-variable.woff2` | [Noto Sans Devanagari](https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth,wght%5D.ttf) | `14ec4af41f27482216d1c2229f417ff9b1425e1babb014e57d1d40d03229853e` |

Conversion on 2026-11-10 used FontTools' WOFF2 writer in a temporary Python
environment; no project or runtime dependency is required. The converted files
were reopened and checked against the source for identical Unicode coverage and
axis ranges. Keep the bundled files and their licenses in version control.

Arabic and Devanagari retain `preload: false`, so English pages only preload the
shared Manrope font.
