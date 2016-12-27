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
from .api import auth_view, user_view, hra_view, email_view
from .auth import auth as auth_app

# register modules
app.register_blueprint(executive, url_prefix='/executive')
app.register_blueprint(auth_app)
# API Endpoints
app.add_url_rule('/token/', view_func=auth_view,)
app.add_url_rule('/email/', view_func=email_view,)

app.add_url_rule('/users/', view_func=user_view,)

app.add_url_rule('/users/<int:user_id>', view_func=user_view,)

# app.add_url_rule('/hras/',
#                  defaults={'response_id': None},
#                  view_func=hra_view,
#                  methods=['GET'])
#
# app.add_url_rule('/hras/<int:response_id>',
#                  view_func=hra_view,
#                  methods=['GET'])


# def register_api(view, endpoint, url, pk='id', pk_type='int'):
#     view_func = view.as_view(endpoint)
#     app.add_url_rule(url, defaults={pk: None},
#                      view_func=view_func, methods=['GET'])
#     app.add_url_rule(url, view_func=view_func, methods=['POST'])
#     app.add_url_rule('%s<%s:%s>' % (url, pk_type, pk), view_func=view_func,
#                      methods=['GET', 'PUT', 'DELETE'])


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
