from webapp import app, csrf

#import python commons
import sys, os, json, datetime, time

#import Flask and Flask extensions
from flask import Flask, request, Response, session, g, redirect, url_for, abort, render_template, flash, jsonify, make_response
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required


from flask.ext.login import login_required
#init Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.loginUser'
login_manager.session_protection = "strong"

#itsdangerous
from itsdangerous import URLSafeSerializer, BadSignature
password_uss = URLSafeSerializer(app.config['SECRET_KEY'], salt='password_reset')
registration_uss = URLSafeSerializer(app.config['SECRET_KEY'], salt='registration')

from ..server import tc_security

from ..models.forms import *
from ..models.User import User

#Set up the Blueprint for this file/namespace
from flask import Blueprint

auth = Blueprint(
	"auth",
	__name__,
	template_folder='templates',
	static_folder='static',
	static_url_path='/auth'
)


##Flask Routing##
#Route that most browsers will start with, tries to get the user to the last known location,
#otherwise it redirects them to the login screen
@auth.route('/', methods=['GET','POST'])
def renderLoginPage():
	return redirect(request.args.get('next') or url_for('.loginUser'))

#Route and handler for user registration requests
@auth.route('/registration', methods=['GET','POST'])
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
			"first_name": str(form.first_name.data),
			"last_name": str(form.last_name.data),
			"password": str(form.password.data),
			"confirm_password": str(form.confirm_password.data),
			"email": str(form.email.data),
			"dob": user_dob
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
		return redirect(url_for('hra.renderHRA'))
	return render_template('user_registration.html',form=form)


#Route and handler for user login requests
@auth.route('/login', methods=['GET','POST'])
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

		return redirect(request.args.get('next') or url_for('hra.renderHRA'))
	#else return with errors (TODO)
	return render_template('user_login.html',form=form)


#Route and handler for user logout requests
@auth.route('/logout')
@login_required
def logoutUser():
	logout_user()
	return redirect(url_for('.loginUser'))


#Route that collects the email from an un-authenticated user and sends a Reset Password Email
@auth.route('/forgot_password', methods=['GET','POST'])
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
			return redirect(url_for('.loginUser'))
		else:
			flash('The email you provided does not exist in our system. Please provide the email you registered.')
			return redirect(url_for('.forgotPassword'))
	return render_template('forgot_password.html', form=form)


#Route that handles the Reset Password workflow. Logs a user in based on the session id
@auth.route('/reset_password/<id>', methods=['GET', 'POST'])
def resetPassword(id):
	session_id = ""
	try:
		session_id = password_uss.loads(id)
	except BadSignature:
		flash('Bad link, please try again or request another Reset Password email.')
		return redirect(url_for('.loginUser'))
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
					return redirect(url_for('hra.renderHRA'))
				else:
					flash('The password you provided does not meet the complexity requirements.')
					return ("", 204)
			else:
				return render_template('set_password.html', form=form)
	tc_security.remove_session(session_id)
	flash('Reset code has expired. Please try again.')
	return redirect(url_for('.loginUser'))


#Route that handles the Registration-from-email workflow. Logs a user in based on the session id
@auth.route('/email_registration/<id>', methods=['GET', 'POST'])
def emailRegistration(id):
	session_id = ""
	try:
		session_id = registration_uss.loads(id)
	except BadSignature:
		flash('Registration Key not recognized. Please follow the exact link provided in the Registration Email.')
		return redirect(url_for('.loginUser'))
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
					return redirect(url_for('hra.renderHRA'))
				else:
					flash('The password you provided does not meet the complexity requirements.')
					return ("", 204)
			else:
				return render_template('set_password.html', form=form)
	tc_security.remove_session(session_id)
	flash('Registration Error. It seems that we don\'t have you in our records.')
	return redirect(url_for('.loginUser'))


#callback used by Flask-Login to reload a user object from a userid in a session
@login_manager.user_loader
def load_user(userid): #callback used by Login Manager, passes a unicode string userid
	user = User(tc_security.get_web_app_user(tcid=str(userid)))
	if not user:
		return None #this callback must return None if the user does not exist
	return user
