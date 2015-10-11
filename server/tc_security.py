### This file holds security-related helper functions for the Triad Care Web Application. ###

from passlib.hash import bcrypt
import json
import re 
MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"

grade_scores = {"A": 4.0, "B": 3.0, "C": 2.0, "D": 1.0, "F": 0.0}

import data_transfer

# called to store the HRA results for a particular patient.
def store_hra_results(tcid="", hra_results={}):
	return data_transfer.store_hra_answers(tcid, hra_results) 

# called to process the HRA results into a health score
def process_hra_results(hra_results={}):
	del hra_results['csrf_token'] #clean the form results for processing


# called to retrieve the WebAppUser with the provided email or tcid
def get_web_app_user(email="", tcid=""):
	if email != "":
		return data_transfer.get_user_with_email(email)
	elif tcid != "":
		return data_transfer.get_user_with_tcid(tcid)
	return None
	

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
	return False

# function to retrieve and return the hra answers
def get_hra_results(tcid=""):
	#right now this function just checks if there is a record of an hra for this user. A check for completion is a TODO...
	return data_transfer.get_hra_results(tcid)

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
	
	try:
		hra_results = get_hra_results(tcid)
		
		score = {}
		
		dont_score = 0  # Count the number of answers that shouldn't scored
		
		with open('../webroot/hra.json') as hra_file:  # Need the meta data from this file. Should probably come from TCDB in the future.
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


# This function returns the average HRA scores for everyone who has taken the HRA
def get_tc_hra_score():
	# Need the meta data from this file. Should probably come from TCDB in the future.
	with open('../webroot/hra.json') as hra_file:  
		hra_data = json.load(hra_file)
	# Get the question names that we are concerned with
	groupings = hra_data['hra_meta']['groupings']
	question_names = []
	groups = {} # create a dict of groups and question names to be used later when averaging section scores.
	for group in groupings:
		if group['graded']:
			groups[group['group']] = [] # make a new list of question names for this group name key.
			for q in group['questions']:
				question_name = "question_" + str(q)
				question_names.append(question_name)
				groups[group['group']].append(question_name)
	# get all of the answers for these questions
	hra_results = data_transfer.get_hra_data(question_names)
	column_names = hra_results.pop(0)
	hra_results = hra_results[0]
	# build the dict of scores for each question
	scores = {}
	for idx, column in enumerate(column_names):
		total_points = 0
		dont_count = 0 # var used to count the number of N/As and nulls so that they don't count against the score
		for result in hra_results:
			if result[idx] is None or result[idx] == "N/A":
				dont_count += 1
			else:
				total_points += grade_scores[result[idx][:1]]
		scores[column_names[idx]] = round(total_points/(len(hra_results)-dont_count),1)
	#for each graded section, figure out the average score
	graded_sections = {}
	for group in groups:
		total_points = 0
		for question in groups[group]:
			total_points += scores[question]
		graded_sections[group] = round(total_points/len(groups[group]),1)
	
	# Lastly, calculate the Overall Score
	overall_total = 0
	for s in graded_sections.values():
		overall_total += s
	graded_sections["Overall"] = round(overall_total/len(graded_sections.values()),1)
	
	return graded_sections


#helper function for this one-time pdf print issue. 
#gets the next tcid in the list of Box Board employees.
# DOES NOT BELONG IN PRODUCTION. USED FOR PRINTING ALL SCORECARDS FOR BOX BOARD.
#def get_next_id(this_id):
#	all_box_board_employee_ids = data_transfer.get_user_ids_from_box_board()
#	return all_box_board_employee_ids[all_box_board_employee_ids.index(this_id)+1]



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


#this function should be called for ANY user input that should abide by the following rules:
#  1. Only contains alphanumerics and @ and .
# Please add more rules to this list as you see fit. May need to add options list to turn on/off tests
def is_sanitary(input): 
	if re.match("^[A-Za-z0-9@\.]*$", input):
		return True
	return False
