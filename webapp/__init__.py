# import Flask and Flask extensions
from flask import Flask, render_template, request, make_response, jsonify
from flask_login import login_required
from flask_wtf.csrf import CsrfProtect
from flask_sqlalchemy import SQLAlchemy
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
db = SQLAlchemy(app)
db.Model.metadata.reflect(db.engine)
# WTF CSRF Protection
csrf = CsrfProtect(app)
# Flask-Webpack
webpack = Webpack()
webpack.init_app(app)

# import modules
from .executive import executive
# Using the File Maker User API as a RestFM Proxy
from .api_fm import fm_user_view as user_view
# from .api import user_view
from .api import auth_view, email_view
from .auth import auth as auth_app

# register modules
app.register_blueprint(executive, url_prefix='/executive')
app.register_blueprint(auth_app)
# API Endpoints
app.add_url_rule('/token/', view_func=auth_view,)
app.add_url_rule('/email/', view_func=email_view,)

app.add_url_rule('/users/', view_func=user_view,)

app.add_url_rule('/users/<string:record_id>', view_func=user_view,)


@app.errorhandler(Exception)
def error_handler(e):
    if not hasattr(e, 'code'):
        e.code = 500

    if app.debug:
        logError(e, request)
    else:
        pass  # Need to log to file here
    return make_response(jsonify({
        'error': True,
        'message': e.message,
        'code': e.code
    }), e.code)

# This starts the app locally with the built-in Flask web server
if __name__ == '__main__':
    app.run()
