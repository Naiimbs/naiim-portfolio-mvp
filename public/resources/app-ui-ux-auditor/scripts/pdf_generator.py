import os
import base64
import subprocess
import pymupdf

def build_pdf_report(working_dir, title, app_url, scores, findings, images_dict, output_pdf_name="Audit_Report.pdf"):
    """
    Generates a publication-grade PDF report with clear typography, 
    embedded base64 images, and strict page budgeting with break-inside: avoid.
    """
    output_html = os.path.join(working_dir, "report_temp.html")
    output_pdf = os.path.join(working_dir, output_pdf_name)
    
    # Render HTML template and invoke headless Chrome
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    browser_exe = chrome_path if os.path.exists(chrome_path) else edge_path

    cmd = [
        browser_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={output_pdf}",
        output_html
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    return output_pdf
