#import Flask and Flask extensions
from flask import Flask, request, Response, session, g, redirect, url_for, abort, render_template, flash, jsonify, make_response
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
from flask_wtf.csrf import CsrfProtect
from flask_weasyprint import HTML, CSS, render_pdf
from flask_mail import Mail, Message
from itsdangerous import URLSafeSerializer, BadSignature

#Twilio
import twilio.twiml


#import python commons
import sys, os, json, datetime, time

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
#Flask-Mail
mail = Mail(app)
#itsdangerous
password_uss = URLSafeSerializer(app.config['SECRET_KEY'], salt='password_reset')
registration_uss = URLSafeSerializer(app.config['SECRET_KEY'], salt='registration')

#import locals
from forms import *
from User import User


## TWILIO API ##
@app.route("/voice", methods=['GET', 'POST'])
def twilio_webhook():
	
	# TODO:
	# 	Need to retrieve the variables form the request and build the script.
	
	patient_name = request.values.get('patient_name', "")
	phone_number = request.values.get('phone_number', "")
	fasting = request.values.get('fasting', " Fasting is not required. ")
	date = request.values.get('date', "")
	time = request.values.get('time', "")
	location = request.values.get('location', "")
	provider = request.values.get('provider', "")
		
	# Get the caller's phone number from the incoming Twilio request
	message = ("This is Triad Care reminding you of your appointment scheduled on " + date + " at " + time + " at " + location + " with " + provider + "." + fasting + "Please contact 336-541-6475 should you have questions or concerns. Thank you.")

	# Respond to incoming requests.
	resp = twilio.twiml.Response()
	resp.say(message, voice="female")

	return str(resp)


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
		try:
			user_dob = datetime.datetime.strptime(str(form.dob_month.data) + "/" + str(form.dob_day.data) + "/" + str(form.dob_year.data), "%m/%d/%Y").date()
		except ValueError:
			flash('The Date of Birth you entered is not a valid date.')
			return render_template('user_registration.html',form=form)
		userDict = {
			"tcid": str(form.tcid.data), #comes out of the form as unicode (needs to be str in python 2.7)
			"id_type": str(form.id_type.data),
			"first_name": str(form.first_name.data),
			"last_name": str(form.last_name.data),
			"password": str(form.password.data),
			"confirm_password": str(form.confirm_password.data),
			"email": str(form.email.data),
			"dob": user_dob
		}
		#try to register the user with our database
		userData = tc_security.register_user(userDict)
		if userData is None:  # Could not register
			flash('Registration failed, you may have already registered. If not, please check that your ID is correct and you are following all of the requirements.')
			return render_template('user_registration.html',form=form)
		# Create a User object
		user = User(userData)
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
			
		return redirect(request.args.get('next') or url_for('render_dashboard'))
		#return redirect(url_for('renderHRA')) #PLEASE REVERT TO LINE ABOVE IN PRODUCTION
	#else return with errors (TODO)
	return render_template('user_login.html',form=form)


#Route and handler for user logout requests
@app.route('/logout')
@login_required
def logoutUser():
	logout_user()
	return redirect(url_for('loginUser'))


#Route that collects the email from an un-authenticated user and sends a Reset Password Email
@app.route('/forgot_password', methods=['GET','POST'])
def forgotPassword():
	form = ForgotPasswordForm()
	if form.validate_on_submit():
		email_addr = str(form.email.data)
		#first check if the email exists
		if tc_security.email_exists(email_addr):
	
			password_session_id = tc_security.generateSession(user=email_addr, duration="20")
			password_session_digest = password_uss.dumps(password_session_id)
			
			email = Message(
				"Triad Care Portal - Reset Password",
				recipients=[email_addr],
				html= ("<div>Click on the link below to set a new password.</div>\
				<div><a href='https://my.triadcare.com/reset_password/" + password_session_digest + "'>Reset Password</a></div>")
			)
			mail.send(email)
			
			flash('An email has been sent (check your spam folder). Please follow the instructions in the email to reset your password.')
			return redirect(url_for('loginUser'))
		else:
			flash('The email you provided does not exist in our system. Please provide the email you registered.')
			return redirect(url_for('forgotPassword'))
	return render_template('forgot_password.html', form=form)


#Route that handles the Reset Password workflow. Logs a user in based on the session id
@app.route('/reset_password/<id>', methods=['GET', 'POST'])
def resetPassword(id):
	session_id = ""
	try:
		session_id = password_uss.loads(id)
	except BadSignature:
		flash('Bad link, please try again or request another Reset Password email.')
		return redirect(url_for('loginUser'))
	user_email = tc_security.get_user_from_valid_session(session_id)
	if not user_email is None:
		user = User(tc_security.get_web_app_user(email=user_email))
	
		if login_user(user):
			form = SetPasswordForm()
			if form.validate_on_submit():
				password = str(form.password.data)
				if tc_security.set_password(current_user.get_id(), password):
					flash('Password change successful')
					tc_security.remove_user_session(user_email)
					return redirect(url_for('renderHRA'))
				else:
					flash('The password you provided does not meet the complexity requirements.')
					return ("", 204)
			else:
				return render_template('set_password.html', form=form)
	tc_security.remove_session(session_id) 
	flash('Reset code has expired. Please try again.')
	return redirect(url_for('loginUser'))


#Route that handles the Registration-from-email workflow. Logs a user in based on the session id
@app.route('/email_registration/<id>', methods=['GET', 'POST'])
def emailRegistration(id):
	session_id = ""
	try:
		session_id = registration_uss.loads(id)
	except BadSignature:
		flash('Registration Key not recognized. Please follow the exact link provided in the Registration Email.')
		return redirect(url_for('loginUser'))
	user_email = tc_security.get_user_from_valid_session(session_id)
	if not user_email is None:
		user = User(tc_security.get_web_app_user(email=user_email))
	
		if login_user(user):
			form = SetPasswordForm()
			if form.validate_on_submit():
				password = str(form.password.data)
				if tc_security.set_password(current_user.get_id(), password):
					flash('Registration successful. Come on in!')
					tc_security.remove_user_session(user_email)
					return redirect(url_for('renderHRA'))
				else:
					flash('The password you provided does not meet the complexity requirements.')
					return ("", 204)
			else:
				return render_template('set_password.html', form=form)
	tc_security.remove_session(session_id) 
	flash('Registration Error. It seems that we don\'t have you in our records.')
	return redirect(url_for('loginUser'))


# Admin Route that handles bulk-emailing registration emails for a specific Account.
@app.route('/registration-kick-off/<account>', methods=['GET'])
@login_required
def bulkRegisterUsers(account):
	if current_user.get_email() == 'jwhite@triadcare.com':
		users = tc_security.get_next_fifty_users_for(account)
		count = 0
		with mail.connect() as conn:
		    for user in users:
				if user['email'] is not None:
					registration_session_id = tc_security.generateSession(user=user['email'], duration="-1")
					registration_session_digest = registration_uss.dumps(registration_session_id)
				
					email = Message(
						"Register for Triad Care Portal and Complete Your Health Asssessment",
						recipients=[user['email']],
						html= ("<div>Hi " + user['first_name'] + "!</div><br><div>You have been registered by your company to take \
						Triad Care's Health Assessment as part of your wellness program. The link below will allow you to complete \
						the registration process and take the Health Assessment in the Triad Care Portal. This assessment is \
						confidential and will take approximately 20 minutes to complete.</div><br>\
						<div>Once you click on the link below you will be taken to the Triad Care Portal where you will set and confirm \
						your password for your new account.</div><br>\
						<div><a href='https://my.triadcare.com/email_registration/" + registration_session_digest + "'>Register</a></div><br> \
						<div>Please follow the password requirements: <ul><li>Must be longer than 8 characters.</li>\
						<li>Must use at least one uppercase, one lowercase, and one special character (e.g.- !$&@, etc.)</li></ul></div><br>\
						<div>After you set your password you will be taken to the login page. Please use your email address \
						(" + user['email'] + ") and your new password to log in.</div><br>\
						<div>Once you have logged in you will be able to begin the questionnaire. Please note, all questions are required \
						and you will only be able to see your confidential results after you click the 'Complete' button at the end of the \
						questionnaire.</div><br><div>Please email Triad Care Customer Service at customercare@triadcare.com if you have any trouble.\
						")
					)
					conn.send(email)
					count += 1
		summary = Message(
			"Bulk Registration Emails sent to employees of " + account,
			recipients=['jwhite@triadcare.com', 'jpatterson@triadcare.com', 'rwhite@triadcare.com'],
			html = ("<div>Number of emails sent: " + str(count) + " out of " + str(len(users)) + "</div>")
		)
		mail.send(summary)
		return "Finished."
		
	else:
		flash("You are not authorized to access this page.")
		return redirect(url_for("logoutUser"))

# Admin Route that handles bulk-emailing HRA reminder emails for a specific Account.
@app.route('/hra-reminders/<account>', methods=['GET'])
@login_required
def bulkRemindUsers(account):
	if current_user.get_email() == 'jwhite@triadcare.com':
		users = tc_security.get_reminder_email_addresses(account)
		count = 0
		with mail.connect() as conn:
		    for user in users:
				if user['email'] is not None:
				
					email = Message(
						"Reminder to complete your Triad Care Health Assessment",
						recipients=[user['email']],
						html= ("<div>Hi " + user['first_name'] + "!</div><br><div>This is a friendly reminder to complete \
						the Health Assessment in the Triad Care Portal.</div><br>\
						<div>Once you click on the link below you will be taken to the Triad Care Portal where you can log in and complete your Assessment.</div><br>\
						<div><a href='https://my.triadcare.com/'>Complete my Health Assessment</a></div><br> \
						<div>Please use your email address (" + user['email'] + ") to log in.</div><br>\
						<div>Once you have logged in you will be able to complete the questionnaire. Please note, all questions are required \
						and you will only be able to see your confidential results after you click the 'Complete' button at the end of the \
						questionnaire.</div><br><div>Please email Triad Care Customer Service at customercare@triadcare.com if you have any trouble.\
						")
					)
					conn.send(email)
					count += 1
		summary = Message(
			"Bulk Reminder Emails sent to employees of " + account,
			recipients=['jwhite@triadcare.com', 'jpatterson@triadcare.com', 'rwhite@triadcare.com'],
			html = ("<div>Number of emails sent: " + str(count) + " out of " + str(len(users)) + "</div>")
		)
		mail.send(summary)
		return "Finished."
		
	else:
		flash("You are not authorized to access this page.")
		return redirect(url_for("logoutUser"))

#Route that displays the HRA. Requires login.
@app.route('/hra', methods=['GET','POST'])
@login_required
def renderHRA():
	form = EmptyForm()
	if form.validate_on_submit():
		if tc_security.store_hra_results(current_user.get_id(), tc_security.process_hra_results(request.form)):
			#if the the user has completed the HRA, redirect to the scorecard.
			if tc_security.user_did_complete_new_hra(current_user.get_id()):
				return redirect(url_for('hra_results'))
			else: 
				flash("Please complete your Health Assessment to see your Scorecard.")
				return redirect(url_for('renderHRA'))
		else:
			flash('Submission failed, please contact your administrator.')
			return redirect(url_for('logoutUser'))
	else:
		# need to check if the user needs to take a new HRA
		if not tc_security.should_take_new_hra(current_user.get_id()):  # this function will insert a new survey record if needed
			if tc_security.latest_is_complete(current_user.get_id()) and tc_security.user_did_complete_new_hra(current_user.get_id()):
				return redirect(url_for('hra_results'))
		
		#get HRA JSON data
		os.chdir(os.path.dirname(os.path.realpath(__file__)))
		hra_data = json.load(open(tc_security.get_hra_filename(current_user.get_id()),'r'))
		#parse out the meta survey groupings
		hra_meta = hra_data['hra_meta']
		#get the questions from the hra data
		hra_questions = hra_data['hra_questions']
		
		#passing the empty form in here for the csrf key implementation
		return render_template(
			'hra.html', 
			hra_questions=hra_questions, 
			user_answers=tc_security.get_hra_results(current_user.get_id()), 
			user_language=tc_security.get_hra_language(current_user.get_id()), 
			form=form	
		)

#Route that saves a partial HRA. Requires login.
@app.route('/save_hra', methods=['POST'])
@login_required
def saveHRA():
	tc_security.store_hra_results(current_user.get_id(), tc_security.process_hra_results(request.form))
	# client-side redirect to /login page. Should logout the user before returning Success.
	flash("Your assessment answers have been saved.")
	logoutUser()
	return "Success"


#Route that sets the user's HRA to Spanish. Requires login.
@app.route('/spanish_hra', methods=['POST'])
@login_required
def spanishHRA():
	tc_security.set_to_spanish(current_user.get_id())
	return "Success"
	
#Route that sets the user's HRA to English. Requires login.
@app.route('/english_hra', methods=['POST'])
@login_required
def englishHRA():
	tc_security.set_to_english(current_user.get_id())
	return "Success"


#Route that displays the HRA Results. Requires login.
@app.route('/hra_results', methods=['GET','POST'])
@login_required
def hra_results():
	response_id = request.args.get('response_id', -1)
	if response_id != -1:
		hra = tc_security.get_hra_record(current_user.get_id(), response_id)
		if hra is None or hra['completed'] == 0:  # if no HRA or incomplete, abort
			abort(404)
		
		if hra['surveyID'] < 2:
			#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
			os.chdir(os.path.dirname(os.path.realpath(__file__)))
			hra_data = json.load(open("hra_files/hra.json",'r'))
			#parse out the meta survey groupings
			hra_meta = hra_data['hra_meta']
			#get the questions from the hra data
			hra_questions = hra_data['hra_questions']
			return render_template('hra_results_old.html', 
									hra_questions=hra_questions, 
									hra_meta=hra_meta, 
									user_answers=hra, 
									form=EmptyForm())
		else:
			filename = "hra_files/"
			if hra['surveyID'] == 4:
				filename += "english_02.json"
			else:
				filename += "english_01.json"
			os.chdir(os.path.dirname(os.path.realpath(__file__)))
			hra_data = json.load(open(filename,'r'))
			#parse out the meta survey groupings
			hra_meta = hra_data['hra_meta']
			#get the questions from the hra data
			hra_questions = hra_data['hra_questions']
			return render_template('hra_results.html', 
									hra_questions=hra_questions,
									hra_meta=hra_meta,
									results=tc_security.get_hra_scores_for_user(current_user.get_id(), response_id),
									user_answers=hra, 
									form=EmptyForm())
	
	if not tc_security.latest_is_complete(current_user.get_id()):
		return redirect(url_for('renderHRA'))
	
	if not tc_security.user_did_complete_new_hra(current_user.get_id()):
	
		if tc_security.user_did_complete_old_hra(current_user.get_id()):
			#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
			os.chdir(os.path.dirname(os.path.realpath(__file__)))
			hra_data = json.load(open("hra_files/hra.json",'r'))
			#parse out the meta survey groupings
			hra_meta = hra_data['hra_meta']
			#get the questions from the hra data
			hra_questions = hra_data['hra_questions']
			return render_template('hra_results_old.html', 
									hra_questions=hra_questions, 
									hra_meta=hra_meta, 
									user_answers=tc_security.get_hra_results_old(current_user.get_id()), 
									form=EmptyForm())
		return redirect(url_for('renderHRA'))
	
	else: # user completed the new HRA.
		os.chdir(os.path.dirname(os.path.realpath(__file__)))
		hra_data = json.load(open(tc_security.get_hra_filename(current_user.get_id()),'r'))
		#parse out the meta survey groupings
		hra_meta = hra_data['hra_meta']
		#get the questions from the hra data
		hra_questions = hra_data['hra_questions']
		return render_template('hra_results.html', 
								hra_questions=hra_questions,
								hra_meta=hra_meta,
								results=tc_security.get_hra_scores_for_user(current_user.get_id()),
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
	response_id = request.args.get('response_id', -1)
	return jsonify(**{"userData": tc_security.get_hra_scores_for_user(current_user.get_id(), response_id), "tcData": tc_security.get_tc_hra_score()})
	
# 	#Route that returns hra data for the current user AND Triad Care. Requires login.
# @app.route('/hra_data_unprotected', methods=['POST'])
# @csrf.exempt
# @login_required
# def hra_data_unprotected():
# 	return jsonify(**{"userData": tc_security.get_hra_score(request.form['id']), "tcData": tc_security.get_tc_hra_score()})


#Route that returns the Employer Aggregate Scorecard
@app.route('/aggregate_scorecard/<account>/<int:year>', methods=['GET'])
@login_required
def aggregate_scorecard(account, year):
	account = str(account)
	if account is None:
		return redirect(url_for("loginUser"))
	
	# get the aggregate results for the given account
	results = tc_security.get_hra_data_for_account(account, current_user.get_id(), year)
	
	os.chdir(os.path.dirname(os.path.realpath(__file__)))
	hra_data = json.load(open(tc_security.get_hra_filename(current_user.get_id()),'r'))
	#parse out the meta survey groupings
	hra_meta = hra_data['hra_meta']
	#get the questions from the hra data
	hra_questions = hra_data['hra_questions']
	
	return render_template('aggregate_scorecard.html', 
							account=account,
							year=year,
							hra_questions=hra_questions, 
							hra_meta=hra_meta, 
							results=results, 
							form=EmptyForm())



#Route that takes html data, converts it to PDF using WeasyPrint, and returns the PDF data.
@app.route('/convert_html_to_pdf', methods=['POST'])
@login_required
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


#Route that returns questionnaire HTML for the specified user. Login required.
@app.route('/get_questionnaire', methods=['POST'])
@csrf.exempt
@login_required
def get_questionnaire():
	#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
	hra_data = {}
	os.chdir(os.path.dirname(os.path.realpath(__file__)))
	with open(get_hra_filename(current_user.get_id())) as hra_file:
		hra_data = json.load(hra_file)
	#parse out the meta survey groupings
	hra_meta = hra_data['hra_meta']
	#get the questions from the hra data
	hra_questions = hra_data['hra_questions']
	
	last_id = request.form['id']
	this_id = tc_security.get_next_id(last_id)
	user = data_transfer.get_user_with_tcid(this_id)
	if user['first_name'] is None:
		this_name = this_id
	else:
		this_name = user['first_name'] + " " + user['last_name']
	
	return render_template('questionnaire_results.html',
							hra_questions=hra_questions, 
							hra_meta=hra_meta,
							results=tc_security.get_hra_scores_for_user(this_id), 
							user_answers=tc_security.get_hra_results(this_id),
							this_id=this_id,
							this_name=this_name,
							mailing_addresses=json.dumps(tc_security.get_addresses(this_id)))


#Route that handles the help form.
@app.route('/get_help_form', methods=['GET', 'POST'])
def get_help_form():
	form = HelpForm()
	if request.method == 'GET':
		form.dob['errors'] = []
		return render_template('help_form.html', form=form)
		
	if form.validate_on_submit():
		try:
			user_dob = datetime.datetime.strptime(str(form.dob_month.data) + "/" + str(form.dob_day.data) + "/" + str(form.dob_year.data), "%m/%d/%Y").date()
			email = Message(
				"Your Help Request has been Received",
				recipients=[request.form['email']],
				cc= ['customercare@triadcare.com'],
				bcc=['jwhite@triadcare.com'],
				html = ("<div><h3>Help Request Details:</h3></div>" + 
						"<table>" +
							"<tr><td>Name</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + request.form['name'] + "</td></tr>" +
							"<tr><td>Email</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + request.form['email'] + "</td></tr>" +
							"<tr><td>Phone</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + request.form['phone'] + "</td></tr>" +
							"<tr><td>DOB</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + user_dob.strftime("%m/%d/%Y") + "</td></tr>" +
							"<tr><td>Company</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + request.form['company'] + "</td></tr>" +
							"<tr><td>Comment</td><td>&nbsp;&nbsp;&nbsp;</td><td>" + request.form['comment'] + "</td></tr>" +
						"</table>")
			)
			mail.send(email)
			
			flash("Your help request has been received. We'll contact you with a solution as soon as we can.")
			return json.dumps({"error": False})
			
		except Exception as e:
			flash("There was an error when submitting your request. Please try again.")
			return json.dumps({"error": True})
	
	return render_template('help_form.html', form=form)

#Dashboard View
@app.route('/dashboard', methods=['GET'])
@login_required
def render_dashboard():
	return render_template('dashboard.html')

@app.route('/get_hra_data', methods=['POST'])
@login_required
def get_hras_for_id():
	return jsonify(data=tc_security.get_hra_data_for_user(current_user.get_id(), limit_one=False))

@app.route('/go_to_scorecard/<int:response_id>', methods=['GET'])
@login_required
def go_to_scorecard(response_id):
	return redirect(url_for('hra_results', response_id=response_id))

#Admin Dashboard View
@app.route('/aggregate_dashboard/<account>', methods=['GET'])
@login_required
def render_aggregate_dashboard(account):
	return render_template('aggregate_dashboard.html', account=account)

@app.route('/get_aggregate_hra_data/<account>', methods=['POST'])
@login_required
def get_hras_for_account(account):
	return jsonify(data=tc_security.get_hra_data_for_account(str(account), current_user.get_id()))
	
@app.route('/get_hra_participation_data/<account>', methods=['POST'])
@login_required
def get_hra_participation_for_account(account):
	return jsonify(data=tc_security.get_hra_participation_data_for_account(str(account), current_user.get_id()))


# @app.route('/score_hras', methods=['GET'])
# @login_required
# def score_hras():
# 	raise
# 	return json.dumps(tc_security.score_hras())

# @app.route('/complete_hras', methods=['GET'])
# @login_required
# def complete_hras():
# 	raise
# 	return json.dumps(tc_security.complete_hras())

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
