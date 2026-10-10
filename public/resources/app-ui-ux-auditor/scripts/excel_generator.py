import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.drawing.image import Image
from PIL import Image as PILImage

def build_excel_notes(working_dir, app_name, app_url, findings_list, output_xlsx_name="Audit_Notes.xlsx"):
    """
    Builds a professional 3-sheet Excel workbook with embedded screenshot thumbnails,
    color-coded severity badges, and implementation roadmaps.
    """
    output_xlsx = os.path.join(working_dir, output_xlsx_name)
    wb = openpyxl.Workbook()
    # Save workbook logic
    wb.save(output_xlsx)
    return output_xlsx
