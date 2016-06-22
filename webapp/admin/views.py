from webapp import csrf, mail

#import python commons
import sys, os, json, datetime, time

#import Flask and Flask extensions
from flask import Flask, request, Response, session, g, redirect, url_for, abort, render_template, flash, jsonify, make_response
from flask.ext.login import login_required
from flask_mail import Message

from ..server import tc_security
from ..models.forms import HelpForm

#Set up the Blueprint for this file/namespace
from flask import Blueprint

admin = Blueprint(
	"admin", 
	__name__, 
	template_folder='templates',
	static_folder='static'
)


# Admin Route that handles bulk-emailing registration emails for a specific Account.
@admin.route('/registration-kick-off/<account>', methods=['GET'])
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
		return redirect(url_for("auth.logoutUser"))


# Admin Route that handles bulk-emailing HRA reminder emails for a specific Account.
@admin.route('/hra-reminders/<account>', methods=['GET'])
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
		return redirect(url_for("auth.logoutUser"))


#Route that handles the help form.
@admin.route('/get_help_form', methods=['GET', 'POST'])
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


#Route that returns questionnaire HTML for the specified user. Login required.
@admin.route('/get_questionnaire', methods=['POST'])
@csrf.exempt
@login_required
def get_questionnaire():
	#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
	hra_data = {}
	#Make sure we are in the same directory as this file
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
							
#####	This is used for printing scorecards in bulk for snail-mailing. Will be adapted for admin functions. #####
#Route that returns questionnaire HTML for the specified user. Login required.
# @admin.route('/get_questionnaire', methods=['POST'])
# @login_required
# def get_questionnaire():
# 	#get HRA JSON data (duped code from renderHRA),TODO: break this out to stay DRY
# 	hra_data = {}
# 	#Make sure we are in the same directory as this file
# 	os.chdir(os.path.dirname(os.path.realpath(__file__)))
# 	with open(get_hra_filename(current_user.get_id())) as hra_file:
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
# 							results=tc_security.get_hra_scores_for_user(this_id), 
# 							user_answers=tc_security.get_hra_results(this_id),
# 							this_id=this_id,
# 							this_name=this_name,
# 							mailing_addresses=json.dumps(tc_security.get_addresses(this_id)))


# @admin.route('/score_hras', methods=['GET'])
# @login_required
# def score_hras():
# 	raise
# 	return json.dumps(tc_security.score_hras())

# @admin.route('/complete_hras', methods=['GET'])
# @login_required
# def complete_hras():
# 	raise
# 	return json.dumps(tc_security.complete_hras())
