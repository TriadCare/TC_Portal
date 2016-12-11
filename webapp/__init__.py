# import Flask and Flask extensions
from flask import Flask, render_template, request, make_response, jsonify
from flask_login import login_required
from flask_wtf.csrf import CsrfProtect
from flask_mail import Mail
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
# Flask-Mail
mail = Mail(app)
# Flask-Webpack
webpack = Webpack()
webpack.init_app(app)

# import modules
from .executive import executive
from .api import user_view, hra_view
from .auth import auth

# register modules
app.register_blueprint(executive, url_prefix='/executive')
app.register_blueprint(auth)
# API Endpoints
app.add_url_rule('/users/', view_func=user_view,)

app.add_url_rule('/users/<int:user_id>',
                 defaults={'user_id': None},
                 view_func=user_view,)

app.add_url_rule('/hras/',
                 defaults={'response_id': None},
                 view_func=hra_view,
                 methods=['GET'])

app.add_url_rule('/hras/<int:response_id>',
                 view_func=hra_view,
                 methods=['GET'])


@app.errorhandler(Exception)
def error_handler(e):
    if not hasattr(e, 'code'):
        e.code = 500

    if not app.debug:
        logError(e, request)
    else:
        pass  # Need to log to file here
        print(str(e))
    return make_response(jsonify({
        'error': True,
        'message': e.message,
        'code': e.code
    }), e.code)

# This starts the app locally with the built-in Flask web server
if __name__ == '__main__':
    app.run()
