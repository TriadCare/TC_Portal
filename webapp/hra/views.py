from webapp import csrf

#import python commons
import sys, os, json, datetime, time

#import Flask and Flask extensions
from flask import Flask, request, Response, session, g, redirect, url_for, abort, render_template, flash, jsonify, make_response
from flask_login import login_required, current_user

#import data classes
from ..server import tc_security

from ..models.forms import *

#import the Blueprint to register the views
from . import hra

#Route that displays the HRA. Requires login.
@hra.route('/', methods=['GET','POST'])
@login_required
def renderHRA():
	form = EmptyForm()
	if form.validate_on_submit():
		if tc_security.store_hra_results(current_user.get_id(), tc_security.process_hra_results(request.form)):
			#if the the user has completed the HRA, redirect to the scorecard.
			if tc_security.user_did_complete_new_hra(current_user.get_id()):
				return redirect(url_for('.results'))
			else: 
				flash("Please complete your Health Assessment to see your Scorecard.")
				return redirect(url_for('.renderHRA'))
		else:
			flash('Submission failed, please contact your administrator.')
			return redirect(url_for('auth.logoutUser'))
	else:
		# check if the user has already taken the old hra
		if tc_security.user_did_complete_old_hra(current_user.get_id()):
			return redirect(url_for('.results'))
		
		if tc_security.user_did_complete_new_hra(current_user.get_id()):
			return redirect(url_for('.results'))
		
		#get HRA JSON data
		hra_data = {}
		hra_data = json.load(hra.open_resource("static/hra_files/" + tc_security.get_hra_filename(current_user.get_id())))
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
@hra.route('/save', methods=['POST'])
@login_required
def saveHRA():
	tc_security.store_hra_results(current_user.get_id(), tc_security.process_hra_results(request.form))
	# client-side redirect to /login page. Should logout the user before returning Success.
	flash("Your assessment answers have been saved.")
	logoutUser()
	return "Success"


#Route that sets the user's HRA to Spanish. Requires login.
@hra.route('/spanish', methods=['POST'])
@login_required
def spanishHRA():
	tc_security.set_to_spanish(current_user.get_id())
	return "Success"
	
#Route that sets the user's HRA to English. Requires login.
@hra.route('/english', methods=['POST'])
@login_required
def englishHRA():
	tc_security.set_to_english(current_user.get_id())
	return "Success"


#Route that displays the HRA Results. Requires login.
@hra.route('/results', methods=['GET','POST'])
@login_required
def results():
	if tc_security.user_did_complete_old_hra(current_user.get_id()):
		hra_data = json.load(hra.open_resource("static/hra_files/hra.json"))
		#parse out the meta survey groupings
		hra_meta = hra_data['hra_meta']
		#get the questions from the hra data
		hra_questions = hra_data['hra_questions']
		return render_template('hra_results_old.html', 
								hra_questions=hra_questions, 
								hra_meta=hra_meta, 
								user_answers=tc_security.get_hra_results_old(current_user.get_id()), 
								form=EmptyForm())
	else: # user completed the new HRA.
		if not tc_security.user_did_complete_new_hra(current_user.get_id()):
			return redirect(url_for('.renderHRA'))
		hra_data = json.load(hra.open_resource("static/hra_files/" + tc_security.get_hra_filename(current_user.get_id())))
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



#Route that returns the Employer Aggregate Scorecard
@hra.route('/employer_scorecard/<account>', methods=['GET'])
@login_required
def employer_scorecard(account):
	account = str(account)
	if account is None:
		return redirect(url_for("auth.loginUser"))
	
	# get the aggregate results for the given account
	results = tc_security.get_hra_data_for_account(account)
	
	hra_data = json.load(hra.open_resource("static/hra_files/" + tc_security.get_hra_filename(current_user.get_id())))
	#parse out the meta survey groupings
	hra_meta = hra_data['hra_meta']
	#get the questions from the hra data
	hra_questions = hra_data['hra_questions']
	
	return render_template('employer_scorecard.html', 
							account=account,
							hra_questions=hra_questions, 
							hra_meta=hra_meta, 
							results=results, 
							form=EmptyForm())


#Route that returns hra data for the current user. Requires login.
@hra.route('/user_data', methods=['GET','POST'])
@login_required
def hra_user_data():
	return jsonify(**tc_security.get_hra_score(current_user.get_id()))
	
	
#Route that returns Triad Care hra data. Requires login.
@hra.route('/tc_data', methods=['GET','POST'])
@login_required
def hra_tc_data():
	return jsonify(**tc_security.get_tc_hra_score())
	
	
#Route that returns hra data for the current user AND Triad Care. Requires login.
@hra.route('/data', methods=['GET','POST'])
@login_required
def hra_data():
	return jsonify(**{"userData": tc_security.get_hra_score(current_user.get_id()), "tcData": tc_security.get_tc_hra_score()})
	
#Route that returns hra data for the current user AND Triad Care. Requires login.
# @hra.route('/hra_data_unprotected', methods=['POST'])
# @csrf.exempt
# @login_required
# def hra_data_unprotected():
# 	return jsonify(**{"userData": tc_security.get_hra_score(request.form['id']), "tcData": tc_security.get_tc_hra_score()})

