"""Read-only PDF rendering for browser-generated QA files (requires PyMuPDF).

This creates PNG review images, not new or modified PDFs. Run after browser tests.
Poppler is not installed on the verified Windows host; PyMuPDF is the renderer.
"""
from pathlib import Path
import pymupdf

destination = Path("output/v3-1")
destination.mkdir(parents=True, exist_ok=True)
for source in sorted(Path("tmp/pdfs").glob("v3-1-*.pdf")):
    with pymupdf.open(source) as document:
        print(f"{source.name}: {len(document)} pages")
        for index in sorted({0, len(document) - 1}):
            document[index].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False).save(
                destination / f"{source.stem}-page-{index + 1}.png"
            )
