# import json
# from flask import request, Response
# from flask_weasyprint import HTML, CSS, render_pdf
# from flask.views import MethodView
# from webapp.server.util import api_error
# from webapp import csrf


# class PDF_API(MethodView):
#     decorators = [csrf.exempt]

#     def post(self):
#         try:
#             pdf_data = json.loads(request.data)
#             pdf_html = pdf_data['html']
#             pdf = HTML(string=pdf_html).write_pdf()

#             return Response(
#                 pdf,
#                 mimetype='arraybuffer',
#                 content_type='arraybuffer'
#             )
#         except Exception as e:
#             api_error(ValueError, "Error creating PDF.", 500)
