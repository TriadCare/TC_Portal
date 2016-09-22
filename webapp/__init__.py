#import Flask and Flask extensions
from flask import Flask, render_template
from flask_login import login_required
from flask_wtf.csrf import CsrfProtect
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_webpack import Webpack


#init app with Flask
app = Flask(
		__name__,
		instance_relative_config=True,
		static_folder='../bundle',
		template_folder='templates'
	)

#setting up the Flask app with an external file (config.py)
app.config.from_object('config.default')
app.config.from_pyfile('instance_config.py')

#Flask-SQLAlchemy
db = SQLAlchemy(app)
db.Model.metadata.reflect(db.engine)
#WTF CSRF Protection
csrf = CsrfProtect(app)
#Flask-Mail
mail = Mail(app)
#Flask-Webpack
webpack = Webpack()
webpack.init_app(app)

#import and register modules
from .patient import patient
from .admin import admin
from .api import user_view, hra_view
from .auth import auth
from .hra import hra
from .util import util

app.register_blueprint(patient)
app.register_blueprint(admin, url_prefix='/admin')
app.register_blueprint(auth)
app.register_blueprint(hra, url_prefix='/hra')
app.register_blueprint(util, url_prefix='/util')

app.add_url_rule('/users/', defaults={'user_id': None}, view_func=user_view, methods=['GET'])
app.add_url_rule('/users/<int:user_id>', view_func=user_view, methods=['GET'])
app.add_url_rule('/hras/', defaults={'response_id': None}, view_func=hra_view, methods=['GET'])
app.add_url_rule('/hras/<int:response_id>', view_func=hra_view, methods=['GET'])

# This is called by index.wsgi to start the app
if __name__ == '__main__':
	app.run()
