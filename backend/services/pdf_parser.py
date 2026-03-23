from pdfminer.high_level import extract_text

def extract_text_from_pdf(file_path: str):
    """
    Extracts text from a PDF file page by page.
    For simplicity, treats each page as a single 'slide'.
    """
    from pdfminer.layout import LAParams
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTTextContainer
    
    slides_text = []
    
    try:
        for page_layout in extract_pages(file_path, laparams=LAParams()):
            page_text = ""
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    page_text += element.get_text() + "\n"
            
            # Clean up whitespace
            cleaned_text = " ".join(page_text.split()).strip()
            if cleaned_text:
                slides_text.append(cleaned_text)
                
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        
    return slides_text
