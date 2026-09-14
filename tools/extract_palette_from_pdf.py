#!/usr/bin/env python3
"""
Preciosa Beads PDF Catalog Palette Extractor
Extracts color codes and dominant swatch colors from Preciosa catalog PDF files.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from PIL import Image
    import pypdfium2 as pdfium
    from pypdf import PdfReader
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Please install requirements: pip install pypdfium2 pypdf Pillow")
    sys.exit(1)


def is_background_or_outline(r: int, g: int, b: int) -> bool:
    """Returns True if the pixel is paper background (near white) or dark outline."""
    # Near white paper
    if r > 242 and g > 242 and b > 242:
        return True
    # Black/dark border line
    if r < 35 and g < 35 and b < 35:
        return True
    return False


def get_dominant_color(image: Image.Image, box: Tuple[int, int, int, int]) -> Optional[str]:
    """
    Extracts the median/dominant color from the bounding box of the image,
    ignoring background white and edge artifacts.
    """
    cropped = image.crop(box)
    cropped = cropped.convert("RGB")
    pixels = list(cropped.getdata())

    valid_pixels = [p for p in pixels if not is_background_or_outline(p[0], p[1], p[2])]

    if not valid_pixels:
        # If all were filtered, take inner 50% core
        w, h = cropped.size
        inner = cropped.crop((w // 4, h // 4, w * 3 // 4, h * 3 // 4))
        valid_pixels = list(inner.getdata())

    if not valid_pixels:
        return None

    # Median RGB to avoid specular shine or dark shadow outliers
    valid_pixels.sort(key=lambda p: (p[0] + p[1] + p[2]))
    median_pixel = valid_pixels[len(valid_pixels) // 2]

    return f"#{median_pixel[0]:02x}{median_pixel[1]:02x}{median_pixel[2]:02x}"


def extract_colors_from_pdf(
    pdf_path: str,
    art_no: str = "331 19 001",
    category: Optional[str] = None,
    pages_to_process: Optional[List[int]] = None,
    debug_dir: Optional[str] = None,
) -> Dict:
    """Renders PDF pages and extracts Preciosa color codes and swatches."""
    pdf = pdfium.PdfDocument(pdf_path)
    reader = PdfReader(pdf_path)
    total_pages = len(pdf)

    colors_dict: Dict[str, str] = {}
    found_category = category or "Preciosa Traditional Czech Beads"

    if debug_dir:
        os.makedirs(debug_dir, exist_ok=True)

    for page_idx in range(total_pages):
        page_num = page_idx + 1
        if pages_to_process and page_num not in pages_to_process:
            continue

        print(f"Processing page {page_num}/{total_pages}...")

        # 1. Extract text and 5-digit code matches from pypdf
        page_text = reader.pages[page_idx].extract_text() or ""
        codes_on_page = re.findall(r"\b\d{5}\b", page_text)

        # Look for category titles on page
        category_match = re.search(r"(Opaque|Transparent|Silver Lined|Rainbow|Iris|Alabaster|Metallic|Chalk|Sfinx)[^\n\r]*", page_text, re.IGNORECASE)
        if category_match and not category:
            found_category = category_match.group(0).strip()

        # 2. Render page to high-res image (200 DPI)
        page = pdf[page_idx]
        bitmap = page.render(scale=200 / 72)
        pil_image = bitmap.to_pil()

        # Try to locate swatch strips per code
        # In Preciosa catalogs, pages contain grid tables or swatch rows.
        # If specific bounding boxes cannot be detected automatically,
        # we sample candidate color regions across the rendered layout.
        img_w, img_h = pil_image.size

        # Scan for color code rows
        for idx, code in enumerate(codes_on_page):
            if code in colors_dict:
                continue

            # Approximate swatch sampling region based on vertical page position
            row_y = int((idx + 1) / (len(codes_on_page) + 2) * img_h)
            swatch_box = (int(img_w * 0.45), row_y - 12, int(img_w * 0.65), row_y + 12)

            hex_color = get_dominant_color(pil_image, swatch_box)
            if hex_color:
                colors_dict[code] = hex_color
                if debug_dir:
                    swatch_img = pil_image.crop(swatch_box)
                    swatch_img.save(os.path.join(debug_dir, f"{code}_swatch.png"))

    colors_list = [{"code": code, "hex": hex_val} for code, hex_val in colors_dict.items()]

    result = {
        "artNo": art_no,
        "category": found_category,
        "colors": colors_list,
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="Extract color palette from Preciosa PDF catalog")
    parser.add_argument("--pdf", required=False, help="Path to Preciosa catalog PDF")
    parser.add_argument("--output", default="data/palette.extracted.json", help="Output JSON path")
    parser.add_argument("--art-no", default="331 19 001", help="Preciosa Art No (default: 331 19 001)")
    parser.add_argument("--category", default=None, help="Color category name override")
    parser.add_argument("--pages", default=None, help="Comma-separated page numbers (e.g. 1,2,3)")
    parser.add_argument("--debug", action="store_true", help="Save debug swatch crop images")

    args = parser.parse_args()

    if not args.pdf:
        print("Preciosa PDF Catalog Palette Extractor")
        print("Usage: python tools/extract_palette_from_pdf.py --pdf <catalog.pdf> --output <palette.json>")
        print("Run with --help to see all options.")
        return

    if not os.path.exists(args.pdf):
        print(f"Error: File not found: {args.pdf}")
        sys.exit(1)

    pages = [int(p.strip()) for p in args.pages.split(",")] if args.pages else None
    debug_dir = "tools/debug_swatches" if args.debug else None

    print(f"Extracting palette from {args.pdf}...")
    result = extract_colors_from_pdf(
        pdf_path=args.pdf,
        art_no=args.art_no,
        category=args.category,
        pages_to_process=pages,
        debug_dir=debug_dir,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Done! Extracted {len(result['colors'])} colors into {output_path}")


if __name__ == "__main__":
    main()
