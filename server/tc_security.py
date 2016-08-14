### This file holds security-related helper functions for the Triad Care Web Application. ###
from datetime import datetime as dt
from datetime import timedelta as td
from binascii import hexlify
from passlib.hash import bcrypt
import os
import json
import re 
MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"

grade_scores = {"A": 4.0, "B": 3.0, "C": 2.0, "D": 1.0, "F": 0.0}

import data_transfer


def get_survey_id_for_user(tcid):
	sid = data_transfer.get_hra_sid(tcid)
	if sid is not None:
		return sid
	return "4"


# called to retrieve the WebAppUser with the provided email or tcid
def get_web_app_user(email="", tcid=""):
	if email != "":
		return data_transfer.get_user_with_email(email)
	elif tcid != "":
		return data_transfer.get_user_with_tcid(tcid)
	return None


# function that checks if a given email exists in the TCDB
def email_exists(email=""):
	if email == "" or email is None:
		return False
	
	if data_transfer.get_user_with_email(email) is None:
		return False
	
	return True

def user_is_registered(email):
	if data_transfer.get_user_hash(email) is None:
		return False
	return True
		


# function to call to verify the user's creds. Provides sanitization via other functions in this file.
def authenticate_user(email, password):
	#sanitize inputs and validate the user
	if is_sanitary(email):
 		try:
			return bcrypt.verify(password, data_transfer.get_user_hash(email))
 		except Exception as e:
 		#TODO Log and count incorrect password attempt. Limit to three.
 			return False
	return False

def register_user(userDict):
	if validate_password(userDict['password']):
		# if the password is valid, hash it and validate the rest of the user fields (like, make sure the password and confirm password fields actually match... unless it's ok to do this client-side)
		userDict['password'] = str(bcrypt.encrypt(userDict['password']))
		# then add the user to the database and return result
		return data_transfer.add_user(userDict)
	return None


# returns the hra version the user has taken, otherwise gives the latest.
def get_hra_filename(tcid):
	f = data_transfer.get_hra_filename(tcid)
	if f is not None:
		return "hra_files/" + f
	return "hra_files/english_02.json"

def get_hra_language(tcid):
	sid = data_transfer.get_hra_sid(tcid)
	if sid is not None:
		if sid == "3":
			return "Spanish"
	return "English"


def set_to_spanish(tcid):
	return data_transfer.set_to_spanish(tcid)

def set_to_english(tcid):
	return data_transfer.set_to_english(tcid)


def user_did_complete_hra(tcid):
	if data_transfer.get_hra_results_old(tcid) is not None:
		return True
	return data_transfer.user_did_complete_hra(tcid)

def user_did_complete_new_hra(tcid):
	return data_transfer.user_did_complete_hra(tcid)

def user_did_complete_old_hra(tcid):
	if data_transfer.get_hra_results_old(tcid) is not None:
		return True
	return False

# function to retrieve and return the hra answers
def get_hra_results_old(tcid=""):
	return data_transfer.get_hra_results_old(tcid)

# function to retrieve and return the hra answers
def get_hra_results(tcid=""):
	results = data_transfer.get_hra_results(tcid)
	if results is None:
		return {}
	return results


# called to store the HRA results for a particular patient.
def store_hra_results(tcid="", hra_results={}):
	#first, check if it completed
	with open(os.path.dirname(os.path.abspath(__file__)) + "/../webroot/" + get_hra_filename(tcid)) as hra_file:  # Need the meta data from this file.
		hra_data = json.load(hra_file)
	questions = hra_data['hra_questions']
	
	question_count = 0
	dont_count = []
	for question in questions:
		if question['type'] != 'GRID_HEADER':
			if question['type'] == 'CHECKBOX_GRID':
				dont_count.append(question['qid'])
			else:
				question_count += 1
		
	result_count = 0
	for r in hra_results:
		if r['qid'] not in dont_count:
			result_count += 1
			
	completed = result_count == question_count
	
	score = score_hra_results(tcid, hra_results)
	
	hra_results.append({'qid': 'Diet & Nutrition', 'aid': score['Diet & Nutrition']})
	hra_results.append({'qid': 'Tobacco', 'aid': score['Tobacco']})
	hra_results.append({'qid': 'Physical Activity', 'aid': score['Physical Activity']})
	hra_results.append({'qid': 'Stress', 'aid': score['Stress']})
	hra_results.append({'qid': 'Preventative Care', 'aid': score['Preventative Care']})
	hra_results.append({'qid': 'Overall', 'aid': score['Overall']})
	
	return data_transfer.store_hra_answers(tcid, hra_results, get_survey_id_for_user(tcid), completed)

# takes hra_results and returns a score object:
#	{
#		"Overall": #, 
#		"Diet & Nutrition": #, 
#		"Physical Activity": #, 
#		"Stress": #, 
#		"Tobacco": #, 
#		"Screening and Preventative Care": #
#	}
def score_hra_results(tcid="",hra_results={}):
	if hra_results is None or hra_results == {}:
		return None
	
	answer_dict = dict((x['qid'], x['aid']) for x in hra_results)
	
	score = {}
	
	filename = get_hra_filename(tcid)
	with open(os.path.dirname(os.path.abspath(__file__)) + "/../webroot/" + filename) as hra_file:  # Need the meta data from this file.
		hra_data = json.load(hra_file)
	
	groupings = hra_data['hra_meta']['groupings']
	questions = hra_data['hra_questions']

	answers = {}
	for question in questions:
		r = {}
		try:					
			for a in question['answers']:
				if a['value'] is None and 'conditionalValue' in a:
					r[a['aid']] = a['conditionalValue']
				else:
					r[a['aid']] = a['value']
			answers[question['qid']] = r
		except:
			continue
	
	for group in groupings:
		if group['graded']:
			data = 0
			dont_score = 0  # Count the number of answers that shouldn't be scored

			#tobacco section is graded differently...
			if group['group'] == 'Tobacco':
				tobacco_questions = group['questions']
				if tobacco_questions[0] in answer_dict.keys() and answer_dict[tobacco_questions[0]] == '2':
					if tobacco_questions[1] in answer_dict.keys() and answer_dict[tobacco_questions[1]] == '2':  # checking for tobacco exposure (all or nothing)
						if tobacco_questions[2] in answer_dict.keys() and answer_dict[tobacco_questions[2]] == '2':
							data = 12.0  # you only get full points if no secondhand smoke
						else:
							data = 8.0
			elif group['group'] == 'Preventative Care':
				for q in group['questions']:
					if q not in answer_dict.keys() or answer_dict[q] == '': # If there is no answer, increment dont_count and break
						dont_score += 1
					else:
						try:
							value = answers[q][answer_dict[q]]
						except KeyError:
							value = None
						while type(value) == dict:  # some preventative care questions do count against you
							if 'greaterThanOrEqual' in value:
								if answer_dict[value['qid']] >= value['greaterThanOrEqual']:
									value = value['value']  # unwrap the conditionalValue
								else:
									value = None
									continue
							elif 'equal' in value:
								if answer_dict[value['qid']] == str(value['equal']):
									value = value['value']  # unwrap the conditionalValue
								else:
									value = None
									continue
							else:
								# value is None, don't count and continue
								value = None
								continue
						
						if value not in grade_scores:  # don't count if the grade is not in the grade_scores array
							dont_score += 1
						else:
							data += grade_scores[value]  # Add the grade points together
			else:
				# I need to get a score for each graded section.
				for q in group['questions']:
					
					if q not in answer_dict.keys() or answer_dict[q] is None or answer_dict[q] == '': # If there is no answer, increment dont_count and break
						dont_score += 1
					else:
						g = answers[q][answer_dict[q]]	# Get the letter grade that corresponds to the aid.
						if g not in grade_scores:  # don't count if the grade is not in the grade_scores array
							dont_score += 1
						else:
							data += grade_scores[g]  # Add the grade points together
						
			questions_to_score = (len(group['questions'])-dont_score)
			if data > 0 and questions_to_score > 0:
				data /= questions_to_score  # Divide to get the average for this section
			score[group['group']] = round(data,1)	# Add the average to the score dict with the title of the section as the key
	
	# Lastly, calculate the Overall Score
	overall_total = 0
	for s in score.values():
		overall_total += s
	score["Overall"] = round(overall_total/len(score.values()),1)
	
	return score

# Checks to make sure the user does not need to take a new HRA (returns False if no need)
# If the user does need to take a new HRA, this function inserts a new, blank HRA record and returns True
def should_take_new_hra(tcid):
	new_hra_employers = ["Best Logistics Group", "Box Board Products", "Plum Point Energy Station", "Triad Care, Inc."]
	
	employer = data_transfer.get_user_account_name(tcid)
	
	if employer in new_hra_employers:
		date_created = data_transfer.get_latest_hra_date(tcid)
		if date_created is None or date_created < (dt.today() - td(9*30)):  # if before 9 months ago
			data_transfer.store_hra_answers(tcid, {}, 4, False, True)  # set a new HRA record
			return True
	
	return False

def process_hra_results(hra_results={}):
	#clean the form results for processing
	results = []
	for r in hra_results:
		try:
			if r != 'csrf_token':
				if len(hra_results.getlist(r)) > 1:
					results.append({"qid": str(r), "aid": str(sum(map(int, hra_results.getlist(r))))})
				else:
					results.append({"qid": str(r), "aid": str(hra_results[r])})
				
		except ValueError as e:
			continue
	
	return results

def get_hra_scores_for_user(tcid=""):
	results = data_transfer.get_hra_score(tcid)
	if results is None:
		return {}
	return results


def get_hra_data_for_account(account=""):
	if account == "" or account is None or type(account) is not str:
		return {}
		
	answer_counts = {'1': 0}
	section_scores = {
		"Overall": 0,
		"Tobacco": 0,
		"Diet & Nutrition": 0,
		"Physical Activity": 0,
		"Stress": 0,
		"Preventative Care": 0
	}
	total_completed = 0
	no_age = 0
	
	hra_data = data_transfer.get_hra_data_for_account(account)
	
	for datum in hra_data:
		total_completed += datum['completed']  # completed is a 0 if not completed, a 1 if it is.
		
		for key in datum.keys():
			if key.isdigit():	# only count the questions
				if key == '1':  # if this is the age question, just add them up
					if datum[key].isdigit():
						answer_counts['1'] += int(datum[key])
					else:
						no_age += 1
				elif int(key) in range(38,63):
					if key in answer_counts.keys():
						if datum[key] == '3':	# for chronic condition section, the answer is a checkbox grid that can have 3 different options. Option 3 is both 1 and 2 are checked...
							if '1' in answer_counts[key].keys():
								answer_counts[key]['1'] += 1
							else:
								answer_counts[key]['1'] = 1
							if '2' in answer_counts[key].keys():
								answer_counts[key]['2'] += 1
							else:
								answer_counts[key]['2'] = 1
						else: 
							if datum[key] in answer_counts[key].keys():
								answer_counts[key][datum[key]] += 1
							else:
								answer_counts[key][datum[key]] = 1
					else:
						if datum[key] == '3':	# for chronic condition section, the answer is a checkbox grid that can have 3 different options. Option 3 is both 1 and 2 are checked...
							answer_counts[key] = {'1': 1}
							answer_counts[key] = {'2': 1}
						else: 
							answer_counts[key] = {datum[key]: 1}
						
				elif key in answer_counts.keys():
					if datum[key] in answer_counts[key].keys():
						answer_counts[key][datum[key]] += 1
					else:
						answer_counts[key][datum[key]] = 1
				else:
					answer_counts[key] = {datum[key]: 1}
			else:
				if datum['completed'] == 1:  # only count if the survey was completed
					if key == "Overall":
						section_scores['Overall'] += datum[key]
					elif key == "Tobacco":
						section_scores['Tobacco'] += datum[key]
					elif key == "Diet & Nutrition":
						section_scores['Diet & Nutrition'] += datum[key]
					elif key == "Physical Activity":
						section_scores['Physical Activity'] += datum[key]
					elif key == "Stress":
						section_scores['Stress'] += datum[key]
					elif key == "Preventative Care":
						section_scores['Preventative Care'] += datum[key]
	
	for key in answer_counts.keys():
		if key == '1' and (len(hra_data)-no_age) != 0:
			answer_counts['1'] = round(answer_counts['1']/(len(hra_data)-no_age), 0)
		else:
			total = sum(answer_counts[key].values())  # get total answers for this question
			if total > 0:
				answer_counts[key].update([(x, "{0:.0f}%".format((float(y)/total)*100)) for x, y in answer_counts[key].items()])
		
	
	for key in section_scores.keys():
		if total_completed != 0:
			section_scores[key] = round(section_scores[key] / total_completed, 1)
		else:
			{}
	
	return {"total_completed": total_completed, "answer_counts": answer_counts, "section_scores": section_scores}
	
	
		#Need to get the total answer counts for each question {...qid: [aid: #, aid: #,...]...}
		#Also need to get the scores for each section.
		#Need to figure out the best way to format the data here, so that these calculations will be easiest.
		


# Given the tcid of the user, returns the scores as follows:
#	{
#		"Overall": #, 
#		"Diet & Nutrition": #, 
#		"Physical Activity": #, 
#		"Stress": #, 
#		"Tobacco": #, 
#		"Screening and Preventative Care": #
#	}
def get_hra_score(tcid=""):
	if not user_did_complete_new_hra(tcid):
		
		try:
			hra_results = get_hra_results_old(tcid)
			
			score = {}
			
			dont_score = 0  # Count the number of answers that shouldn't scored
			
			with open(os.path.dirname(os.path.abspath(__file__)) + '/../webroot/hra_files/hra.json') as hra_file:  # Need the meta data from this file. Should probably come from TCDB in the future.
				hra_data = json.load(hra_file)
			
			groupings = hra_data['hra_meta']['groupings']
			
			for group in groupings:
				if group['graded']:
					data = 0
					# I need to get a score for each graded section.
					
					for q in group['questions']:
						q_name = "question_" + str(q)  # Build the question names from the meta
						
						if hra_results[q_name] is None: # If there is no answer, increment dont_count and break
							dont_score += 1
							break
						
						g = hra_results[q_name][:1]	# Get the letter grade from the hra_results for each answer ([:1] gets the first character of the grade string.)
						if g not in grade_scores:  # don't count if the grade is not in the grade_scores array
							dont_score += 1
							break
						
						data += grade_scores[g]  # Add the grade points together
					questions_to_score = (len(group['questions'])-dont_score)
					if data > 0 and questions_to_score > 0:
						data /= questions_to_score  # Divide to get the average for this section
					score[group['group']] = round(data,1)	# Add the average to the score dict with the title of the section as the key
			
			# Lastly, calculate the Overall Score
			overall_total = 0
			for s in score.values():
				overall_total += s
			score["Overall"] = round(overall_total/len(score.values()),1)
			
			return score
		except Exception as e:
			return {}
	
	else:
	
		try:
			return data_transfer.get_hra_score(tcid)
		except Exception as e:
			return None
	
	return {'Nope'}


# This function returns the average HRA scores for everyone who has completed the HRA
def get_tc_hra_score():
	scores = data_transfer.get_all_completed_hra_scores()
	
	if len(scores) == 0:
		return {}
	
	overall_score = 0
	dn_score = 0
	tobacco_score = 0
	stress_score = 0
	screening_score = 0
	physical_score = 0
	
	for score in scores:
		overall_score += score['Overall']
		dn_score += score['Diet & Nutrition']
		tobacco_score += score['Tobacco']
		stress_score += score['Stress']
		screening_score += score['Preventative Care']
		physical_score += score['Physical Activity']
		
	return {
		'Overall': round(overall_score/len(scores),1), 
		'Diet & Nutrition': round(dn_score/len(scores),1), 
		'Tobacco': round(tobacco_score/len(scores),1), 
		'Stress': round(stress_score/len(scores),1), 
		'Preventative Care': round(screening_score/len(scores),1), 
		'Physical Activity': round(physical_score/len(scores),1)
	}


def get_addresses(id):
	triad_care_address = {"Name": "Triad Care, Inc.", "Address1": "302 Pomona Drive", "Address2": "Suite L", "City": "Greensboro", "State": "NC", "PostalCode": "27407"}
	receiver_address = data_transfer.get_user_address(id)
	return {'Sender': triad_care_address, 'Receiver': receiver_address}



# helper function to sanitize and validate the password. Rules are as follows:
#	1. Between min and max length (globals set at top of file)
#	2. Contains at least one upper and lower case letter, number, and special character (including spaces)
def validate_password(password):
	#trying to keep this as slim as possible, so sorry for the readability issues.
	#I'm tackling each rule with this regex.
	if not re.match("^(?=^.{" + MIN_PASSWORD_LENGTH + "," + MAX_PASSWORD_LENGTH + "}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$\^\\\(\)%&_\-=+*/\.,:;\"'{}\[\]?| ]).*$", password):
		return False
	#if the password made it through our test, it passed!
	return True


# helper function to change the password for the provided user_id (should only come from Auth Manager, not user input.)
def set_password(user_id, password):
	if not validate_password(password):
		return False
	return data_transfer.set_password_for_user_id(user_id, str(bcrypt.encrypt(password)))



#this function should be called for ANY user input that should abide by the following rules:
#  1. Only contains alphanumerics and @ and .
# Please add more rules to this list as you see fit. May need to add options list to turn on/off tests
def is_sanitary(input): 
	if re.match("^[A-Za-z0-9@\.]*$", input):
		return True
	return False


def get_users_with_account(account=""):
	if account == "" or account is None:
		return None
	
	return data_transfer.get_users_with_account(account)


def get_next_fifty_users_for(account):
	next_fifty = []
	# get all employees ordered by date created (newest first)
	all_users_with_account = get_users_with_account(account)
	count = 0
	for user in all_users_with_account:
		if user['email'] is not None:
			if not user_has_session(user['email']):
				if not user_is_registered(user['email']):
					count += 1
					next_fifty.append(user)
					if count == 50:
						break
	return next_fifty
	
def get_reminder_email_addresses(account):
	next_fifty = []
	# get all employees ordered by date created (newest first)
	incompletes_with_account = data_transfer.get_incompletes_with_account(account)
	count = 0
	for user in incompletes_with_account:
		if user['email'] is not None:
			count += 1
			next_fifty.append(user)
			if count == 50:
				break
	return next_fifty

def user_has_session(email):
	if data_transfer.retrieve_user_session(email) is None:
		return False
	return True


def get_user_from_valid_session(session_id=""):
	if session_id == "" or session_id is None:
		return None
		
	session_object = data_transfer.retrieve_session(session_id)
	if session_object is None:
		return None
	
	# if the session has timed out, return None (if it is -1, this session does not expire.)
	if session_object['timeout'] != "-1" and (dt.now() - session_object['time_created']).seconds > (int(session_object['timeout']) * 60):
		return None
	
	return session_object['user']

#This function removes all session records with the provided user email.
def remove_user_session(user_email):
	return data_transfer.remove_user_session(user_email)
	
#This function removes the session with the provided session_id.
def remove_session(session_id):
	return data_transfer.remove_session(session_id)


# This function creates and returns a session_id and stores it with some other info in the TCDB.
def generateSession(user, duration="30"):
	if email_exists(user):
		session_id = generateRandomSessionKey()
		data_transfer.store_session(session_id=session_id, user_id=user, timeout=duration)
		return session_id
	return None


# This function generates a random 16 byte string used for session IDs.
def generateRandomSessionKey():
    return hexlify(os.urandom(16))

# Goes through all of the survey_response records that have an Overall score of -1 (Not yet scored) and scores them
def score_hras():
	responses = data_transfer.get_unscored_hras()
	fails = []
	for response in responses:
		#if user_did_complete_hra(response[0]):
		r = data_transfer.update_hra_score(response[0]['tcid'], score_hra_results(response[0]['tcid'], response[1]))
		if r is not True:
			fails.append({"tcid": response[0]['tcid'], "response": r})
	return fails

# def complete_hras():
# 	try:
# 		for tcid in data_transfer.get_survey_tcids():
# 			if data_transfer.user_did_complete_hra(tcid):
# 				data_transfer.complete_hra(tcid)
# 	except Exception as e:
# 		return e
# 	return True

