### This file holds security-related helper functions for the Triad Care Web Application. ###

from passlib.hash import bcrypt
import re 
MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"

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

#function to score the HRA results
def score_hra(answerDict):
	if answerDict is not None:
		return True # TODO: actually score and return... 
	return None	

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
