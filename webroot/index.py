#import Flask and Flask extensions
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, jsonify
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
from flask_wtf.csrf import CsrfProtect
from flask_weasyprint import HTML, CSS, render_pdf

#import python commons
import sys, os, json

#import data class
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'server'))
import data_transfer
import tc_security

#init app with Flask
app = Flask(__name__)
#setting up the Flask app with an external file (config.py)
app.config.from_object('config')
#WTF CSRF Protection
csrf = CsrfProtect(app)
#init Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'loginUser'
login_manager.session_protection = "strong"

#import locals
from forms import LoginForm
from forms import RegistrationForm
from forms import EmptyForm
from User import User


##Flask Routing##
#Route that most browsers will start with, tries to get the user to the last known location,
#otherwise it redirects them to the login screen
@app.route('/', methods=['GET','POST'])
def renderLoginPage():
	return redirect(request.args.get('next') or url_for('loginUser'))

#Route and handler for user registration requests
@app.route('/registration', methods=['GET','POST'])
def renderRegistrationPage():
	form = RegistrationForm()
	if form.validate_on_submit():
		#before, I was using the wtf form to_dict function to get all of the fields... but I need granularity for debugging
		userDict = {
			"tcid": str(form.tcid.data), #comes out of the form as unicode (needs to be str in python 2.7)
			"first_name": str(form.first_name.data),
			"last_name": str(form.last_name.data),
			"password": str(form.password.data),
			"confirm_password": str(form.confirm_password.data),
			"email": str(form.email.data),
			"dob": form.dob.data
		}
		#try to register the user with our database
		if not tc_security.register_user(userDict):
			#I think this is sufficient, I'll handle a lot of the form validation client-side.
			flash('Registration failed, you may have already registered. If not, please check that your TCID is correct and you are following all of the requirements.')
			return render_template('user_registration.html',form=form)
		# Create a User object
		user = User(userDict)
		# Log in the new user with the Login Manager
		if login_user(user):
			flash('Registration Successful, Welcome %s!' % user.first_name)
		else:
			flash('Log in failed, Please try again.')
			return render_template('user_registration.html',form=form)
		return redirect(url_for('renderHRA'))
	return render_template('user_registration.html',form=form)


#Route and handler for user login requests
@app.route('/login', methods=['GET','POST'])
def loginUser():
	form = LoginForm()
	if form.validate_on_submit():
		email = str(form.email.data) #comes out of the form as unicode (needs to be str in python 2.7)
		password = str(form.password.data)
		if not tc_security.authenticate_user(email, password):
			#need to call a auth_failure function here (TODO)
			flash('Authentication failed. Please try again or Sign Up!')
			return render_template('user_login.html',form=form)
		#contruct a user object to log in.
		user = User(tc_security.get_web_app_user(email=email))

		if not login_user(user):
			flash('Log in failed, Please try again.')
			return render_template('user_login.html',form=form)
			
		#return redirect(request.args.get('next') or url_for('renderDashboard'))
		return redirect(url_for('renderHRA')) #PLEASE REVERT TO LINE ABOVE IN PRODUCTION
	#else return with errors (TODO)
	return render_template('user_login.html',form=form)


#Route and handler for user logout requests
@app.route('/logout')
@login_required
def logoutUser():
	logout_user()
	return redirect(url_for('loginUser'))
	

#Route that displays the HRA. Requires login.
@app.route('/hra', methods=['GET','POST'])
@login_required
def renderHRA():
	form = EmptyForm()
	if form.validate_on_submit():
		hra_results = request.form.to_dict()
		#assert app.debug == False
 		tc_security.process_hra_results(hra_results)
 		if tc_security.store_hra_results(current_user.get_id(),hra_results):
			return redirect(url_for('hra_results'))
		else:
			flash('Submission failed, please contact your administrator.')
			return redirect(url_for('logoutUser'))
	else:
		# check if the user has already taken the hra
		results = tc_security.get_hra_results(current_user.get_id())
		if results is not None: # if results exist, just redirect to the results page
			return redirect(url_for('hra_results'))
		#get HRA JSON data
		hra_data = {}
		#Make sure we are in the same directory as this file
		os.chdir(os.path.dirname(os.path.realpath(__file__)))
		with open("hra.json") as hra_file:
			hra_data = json.load(hra_file)
		#parse out the meta survey groupings
		hra_meta = hra_data['hra_meta']
		#get the questions from the hra data
		hra_questions = hra_data['hra_questions']
		
		#passing the empty form in here for the csrf key implementation
		return render_template('hra.html', user=current_user, hra_questions=hra_questions, form=form) # Do I need the user in this template?


#Route that displays the HRA Results. Requires login.
@app.route('/hra_results', methods=['GET','POST'])
@login_required
def hra_results():
	#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
	hra_data = {}
	#Make sure we are in the same directory as this file
	os.chdir(os.path.dirname(os.path.realpath(__file__)))
	with open("hra.json") as hra_file:
		hra_data = json.load(hra_file)
	#parse out the meta survey groupings
	hra_meta = hra_data['hra_meta']
	#get the questions from the hra data
	hra_questions = hra_data['hra_questions']
	
	return render_template('hra_results.html', 
							hra_questions=hra_questions, 
							hra_meta=hra_meta, 
							user_answers=tc_security.get_hra_results(current_user.get_id()), 
							form=EmptyForm())


#Route that returns hra data for the current user. Requires login.
@app.route('/hra_user_data', methods=['GET','POST'])
@login_required
def hra_user_data():
	return jsonify(**tc_security.get_hra_score(current_user.get_id()))
	
	
#Route that returns Triad Care hra data. Requires login.
@app.route('/hra_tc_data', methods=['GET','POST'])
@login_required
def hra_tc_data():
	return jsonify(**tc_security.get_tc_hra_score())
	
	
#Route that returns hra data for the current user AND Triad Care. Requires login.
@app.route('/hra_data', methods=['GET','POST'])
@login_required
def hra_data():
	return jsonify(**{"userData": tc_security.get_hra_score(current_user.get_id()), "tcData": tc_security.get_tc_hra_score()})


#Route that takes html data, converts it to PDF using WeasyPrint, and returns the PDF as a download.
@app.route('/export_to_pdf', methods=['POST'])
@login_required
def export_to_pdf():
	if not current_user.get_id() == '0000000001':
		flash("You are not authorized to access this page.")
		return redirect(url_for("logoutUser"))
	
	#return "HTML: " + request.form['html'] + " Name: " + request.form['name']
	#decoded_str = str(request.form['html'])#.decode("utf8")
	#return HTML(decoded_str.encode("utf8")).write_pdf()

	
	pdf = HTML(string=request.form['html']).write_pdf(stylesheets=[CSS(url_for('static', filename='libs/bootstrap/bootstrap.css')), CSS(url_for('static', filename='style/style.css')), CSS(url_for('static', filename='style/hra.css'))])
	
	with open('/Users/jackwhite/Desktop/scorecards/'+ request.form['name'], "w") as out:
		out.write(pdf)
	
	return "Done"
	
# 	response = render_pdf(HTML(string=request.form['html']), download_filename=request.form['name'])
# 	response.headers['Content-Type'] = "application/download"
# 	return response

#Route that returns questionnaire HTML for the specified user. Login required. DOES NOT BELONG IN PRODUCTION
# @app.route('/get_questionnaire', methods=['POST'])
# @login_required
# def get_questionnaire():
# 	#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
# 	hra_data = {}
# 	#Make sure we are in the same directory as this file
# 	os.chdir(os.path.dirname(os.path.realpath(__file__)))
# 	with open("hra.json") as hra_file:
# 		hra_data = json.load(hra_file)
# 	#parse out the meta survey groupings
# 	hra_meta = hra_data['hra_meta']
# 	#get the questions from the hra data
# 	hra_questions = hra_data['hra_questions']
# 	
# 	last_id = request.form['id']
# 	this_id = tc_security.get_next_id(last_id)
# 	user = data_transfer.get_user_with_tcid(this_id)
# 	if user['first_name'] is None:
# 		this_name = this_id
# 	else:
# 		this_name = user['first_name'] + " " + user['last_name']
# 	
# 	return render_template('questionnaire_results.html',
# 							hra_questions=hra_questions, 
# 							hra_meta=hra_meta, 
# 							user_answers=tc_security.get_hra_results(this_id),
# 							this_id=this_id,
# 							this_name=this_name)


#callback used by Flask-Login to reload a user object from a userid in a session
@login_manager.user_loader
def load_user(userid): #callback used by Login Manager, passes a unicode string userid
	user = User(tc_security.get_web_app_user(tcid=str(userid)))
	if not user:
		return None #this callback must return None if the user does not exist
	return user

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
