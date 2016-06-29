#import Flask and Flask extensions
from flask import Flask, render_template
from flask_login import login_required
from flask_wtf.csrf import CsrfProtect
from flask_mail import Mail


#init app with Flask
app = Flask(
		__name__,
		instance_relative_config=True,
		static_folder='static',
		template_folder='templates'
	)

#setting up the Flask app with an external file (config.py)
app.config.from_object('config.default')
app.config.from_pyfile('instance_config.py')

#WTF CSRF Protection
csrf = CsrfProtect(app)
#Flask-Mail
mail = Mail(app)


#import and register modules
from .admin import admin
from .api import api
from .auth import auth
from .hra import hra
from .util import util

app.register_blueprint(admin, url_prefix='/admin')
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(auth)
app.register_blueprint(hra, url_prefix='/hra')
app.register_blueprint(util, url_prefix='/util')


##Error Page that should be modified when in Production##
@app.errorhandler(500)
def server_error(error):
	return render_template('error_template.html',error=error), 500

#Special CSRF Error handler
@csrf.error_handler
def csrf_error(reason):
	#log CSRF attempt here
	return render_template('error_template.html',error=reason), 400


# This is called by index.wsgi to start the app
if __name__ == '__main__':
	app.run()
