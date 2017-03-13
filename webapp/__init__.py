# import Flask and Flask extensions
from flask import Flask, render_template, request, make_response, jsonify
from flask_login import login_required
from flask_wtf.csrf import CsrfProtect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, Table
from flask_webpack import Webpack

from server.util import logError

# init app with Flask
app = Flask(
    __name__,
    instance_relative_config=True,
    static_folder='../bundle',
    template_folder='templates'
)

# setting up the Flask app with an external file
app.config.from_object('config.default')
app.config.from_pyfile('instance_config.py')


# Flask-SQLAlchemy
# This function formats the column keys
# so they can be represented as object attributes
@event.listens_for(Table, "column_reflect")
def column_reflect(inspector, table, column_info):
    column_info['key'] = column_info['name'].replace(" ", "_").replace("&", "")
db = SQLAlchemy(app)
db.Model.metadata.reflect(db.engine)
# WTF CSRF Protection
csrf = CsrfProtect(app)
# Flask-Webpack
webpack = Webpack()
webpack.init_app(app)

# import modules
from .executive import executive
from .patient import patient
# Using the File Maker User API as a RestFM Proxy
from .api_fm import fm_user_view as user_view
from .api_fm import fm_account_view as account_view
from .api_fm import fm_location_view as location_view
from .api_fm import fm_biometric_view as biometric_view
from .api_fm import fm_visit_view as visit_view
# from .api import user_view
from .api import auth_view, email_view, hra_view, pdf_view
from .auth import auth as auth_app

# register modules
app.register_blueprint(executive, url_prefix='/executive')
app.register_blueprint(patient, url_prefix='/patient')
app.register_blueprint(auth_app)
# API Endpoints
app.add_url_rule('/token/', view_func=auth_view,)
app.add_url_rule('/email/', view_func=email_view,)
app.add_url_rule('/pdf/', view_func=pdf_view,)
app.add_url_rule('/hras/', view_func=hra_view,)
app.add_url_rule('/hras/<string:response_id>', view_func=hra_view,)

app.add_url_rule('/users/', view_func=user_view,)
app.add_url_rule('/users/<string:record_id>', view_func=user_view,)
app.add_url_rule('/accounts/', view_func=account_view,)
app.add_url_rule('/locations/', view_func=location_view,)
app.add_url_rule('/biometrics/', view_func=biometric_view,)
app.add_url_rule('/visits/', view_func=visit_view,)


@app.errorhandler(Exception)
def error_handler(e):
    if not hasattr(e, 'code'):
        e.code = 500

    if app.debug:
        logError(e, request)
    else:
        if e.code == 500:
            logError(e, request)
    return make_response(jsonify({
        'error': True,
        'message': e.message,
        'code': e.code
    }), e.code)

# This starts the app locally with the built-in Flask web server
if __name__ == '__main__':
    app.run()
