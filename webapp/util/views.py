from webapp import app, csrf

from flask import Response, request
from flask_weasyprint import HTML, CSS, render_pdf

import json

#Set up the Blueprint for this file/namespace
from flask import Blueprint

util = Blueprint(
	"util", 
	__name__
)

#Route that takes html data, converts it to PDF using WeasyPrint, and returns the PDF data.
@util.route('/convert_html_to_pdf', methods=['POST'])
#@login_required
def export_to_pdf():
	try:
		pdf_data = json.loads(request.data)
		pdf_html = pdf_data['html']
		pdf = HTML(string=pdf_html).write_pdf()
	
		return Response(pdf, mimetype='arraybuffer', content_type='arraybuffer')
	except Exception as e:
		if app.debug == True:
			return json.dumps({"error": True, "message": str(e)})
		else:
			return json.dumps({"error": True})


