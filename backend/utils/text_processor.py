import fitz  # PyMuPDF
import docx
import io

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extracts text from a PDF file byte stream."""
    text = ""
    with fitz.open(stream=file_content, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(file_content: bytes) -> str:
    """Extracts text from a DOCX file byte stream."""
    doc = docx.Document(io.BytesIO(file_content))
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

def extract_text(filename: str, file_content: bytes) -> str:
    """Handles text extraction based on file extension."""
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_content)
    elif filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_content)
    elif filename.lower().endswith(".txt"):
        return file_content.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {filename}")
