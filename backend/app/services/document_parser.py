"""
PRAGMA — Offline Document Parser

Converts uploaded files to plain text for MAP extraction.
100% local — no cloud OCR, no external APIs.

Supported formats:
  PDF  — via PyMuPDF (fitz)
  DOCX — via python-docx
  DOC  — best-effort via python-docx (may fail on old binary format)
  TXT  — direct decode with encoding detection
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def parse_pdf(content: bytes, max_pages: int = 100) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError(
            "PyMuPDF not installed. Run: pip install pymupdf"
        )

    text_parts = []
    with fitz.open(stream=content, filetype="pdf") as doc:
        total = len(doc)
        if total > max_pages:
            logger.warning("PDF has %d pages; truncating to first %d", total, max_pages)
        for page_num in range(min(total, max_pages)):
            page_text = doc[page_num].get_text("text")
            if page_text.strip():
                text_parts.append(page_text)

    full_text = "\n\n".join(text_parts)
    if not full_text.strip():
        raise ValueError("PDF appears to be image-only or empty. Text extraction returned no content.")

    return full_text.strip()


def parse_docx(content: bytes) -> str:
    try:
        import docx
        from io import BytesIO
    except ImportError:
        raise RuntimeError(
            "python-docx not installed. Run: pip install python-docx"
        )

    from io import BytesIO
    doc = docx.Document(BytesIO(content))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    if not paragraphs:
        raise ValueError("DOCX file appears to be empty or unreadable.")
    return "\n\n".join(paragraphs)


def parse_txt(content: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            return content.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode text file with any common encoding.")


def parse_document(filename: str, content: bytes, max_pages: int = 100) -> str:
    """
    Parse any supported document format to plain text.

    Args:
        filename: Original filename (used to detect format by extension)
        content:  Raw bytes of the file

    Returns:
        Extracted plain text

    Raises:
        ValueError: Unsupported format or parsing failure
        RuntimeError: Required parsing library not installed
    """
    ext = Path(filename).suffix.lower().lstrip(".")

    if ext == "pdf":
        text = parse_pdf(content, max_pages=max_pages)
    elif ext in ("docx", "doc"):
        text = parse_docx(content)
    elif ext == "txt":
        text = parse_txt(content)
    else:
        raise ValueError(
            f"Unsupported file type '.{ext}'. "
            "Supported formats: PDF, DOCX, DOC, TXT"
        )

    # Sanity check — extraction must yield actionable text
    if len(text.strip()) < 100:
        raise ValueError(
            f"Extracted text is too short ({len(text)} characters). "
            "The document may be corrupted, image-only, or empty."
        )

    logger.info("Parsed %s (%d bytes) → %d characters of text", filename, len(content), len(text))
    return text
