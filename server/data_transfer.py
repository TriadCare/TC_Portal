import MySQLdb as mdb
import json
import sys
import os
from datetime import datetime as dt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'tc_configuration'))
# globals
from conn import *

def getConnection():
	return mdb.connect(server, user, passwd, db)


def add_user(userDict):
	#get the connection cursor
	conn = getConnection() #holding onto connection so we can commit the additions later
	cursor = conn.cursor()
	#Should first check if the user exists (has a record with tcid in webappusers)
	#Then, if they don't have a record, try to match on patient id, they must have a record in the Patient table to create an account.
	#May need to log various things here and give feedback to the user based on what happens.
	try:
		# first check if the tcid already exists in the TCDB
		cursor.execute("select tcid, email, dob, hash from webappusers where tcid=%s", [userDict['tcid']])
 		result = cursor.fetchall()
 		
 		if len(result): # already have a record, need to confirm they have their DOB right and don't already have a password
	 		desc = []
	 		for d in cursor.description: #get a list of the column names
				desc.append(d[0])
				
			result = dict(zip(desc, result[0]))
			if result['hash'] is not None:
				return False  # User already has a password, already registered.
			if (result['email'] != None and userDict['email'] != result['email']) or userDict['dob'] != result['dob']:
				return False
		else:  # TCID does not exist.
			return False
		values = [userDict['first_name'], userDict['last_name'], userDict['password'], userDict['email'], userDict['dob'], dt.now(), userDict['email'], userDict['tcid']]
		cursor.execute("update webappusers set first_name=%s, last_name=%s, hash=%s, email=%s, dob=%s, DATE_UPDATED=%s, USER_UPDATED=%s where tcid=%s", values)
	except Exception as e:
		return False
	#if no exceptions, commit the addition
	conn.commit()
	return True
	
def get_user_hash(email):
	#get the connection cursor
	cursor = getConnection().cursor()
	#get the password hash from the database *Note: email should be scrubbed by now because this function is internal*
	cursor.execute("select hash from webappusers where email = %s", [email])
	h = cursor.fetchone()
	if h is not None and len(h) > 0:
		return h[0]
	return None

def get_user_with_email(email):
	#get the connection cursor
	cursor = getConnection().cursor()
	try:
		cursor.execute("select tcid, first_name, last_name, email, dob from webappusers where email = %s", [email])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) > 1:
			return None
			
		return dict(zip(desc, result[0]))
	except:
		return None
	
	return None

def get_user_with_tcid(tcid):
	#get the connection cursor
	cursor = getConnection().cursor()
	try:
		cursor.execute("select tcid, first_name, last_name, email, dob from webappusers where tcid = %s", [tcid])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) > 1:
			return None
		
		return dict(zip(desc, result[0]))

	except Exception as e:
		return None
	
	return None

def get_users_with_account(account):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select * from webappusers where Account=%s order by DATE_CREATED desc", [account])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		users = []
		for r in result:
			users.append(dict(zip(desc, r)))
		return users

	except Exception as e:
		return None
	
	return None

def get_incompletes_with_account(account):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select email, first_name from webappusers where tcid in (select tcid from survey_response where tcid in (select tcid from webappusers where Account=%s) and completed=0)", [account])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		users = []
		for r in result:
			users.append(dict(zip(desc, r)))
		return users

	except Exception as e:
		return e
	
	return None


def store_session(session_id="", user_id="", timeout=""):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("insert into session (sid, user, time_created, timeout) values (%s, %s, %s, %s)", [session_id, user_id, dt.now(), timeout])
	except Exception as e:
		return None
	
	conn.commit()
	return True


def retrieve_session(session_id=""):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select sid, user, time_created, timeout from session where sid = %s", [session_id])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) != 1:
			return None
			
		return dict(zip(desc, result[0]))
	except Exception as e:
		return None
	
	return None

def retrieve_user_session(email=""):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select sid, user, time_created, timeout from session where user = %s", [email])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) != 1:
			return None
			
		return dict(zip(desc, result[0]))
	except Exception as e:
		return None
	
	return None

def remove_session(session_id):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("delete from session where sid=%s", [session_id])
	except Exception as e:
		return False
	conn.commit()
	return True

def remove_user_session(user_email):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("delete from session where user=%s", [user_email])
	except Exception as e:
		return False
	conn.commit()
	return True


def set_password_for_user_id(user_id, hash):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("update webappusers set hash=%s where tcid=%s", [hash, user_id])
	except Exception as e:
		return False
	conn.commit()
	return True



def store_hra_answers(tcid, hra_answers, surveyID, completed):
	#get the connection cursor
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select count(*) from survey_response where (tcid=%s and surveyID=%s)", [tcid, surveyID])
		c = cursor.fetchall()[0][0]
		
		valueCount = "%s, %s, %s, %s, %s, "
		columns = ['completed']
		values = ['1'] if completed else ['0']
		for answer in sorted(hra_answers, key=lambda k: k['qid']):
			valueCount += "%s, "
			columns.append("`" + str(answer['qid']) + "`")
			values.append(str(answer['aid']))
		valueCount = valueCount[:-2]
		if c > 0:
			columns[:0] = ['USER_UPDATED']
			values[:0] = [get_user_with_tcid(tcid)['email']]
			query = "update survey_response set %s" % "=%s, ".join(columns) + "=%s where (tcid=%s and surveyID=%s)"
			values += [tcid, surveyID]
		else:
			columns[:0] = ['USER_CREATED', 'DATE_CREATED', 'tcid', 'surveyID']
			values[:0] = [get_user_with_tcid(tcid)['email'], dt.now(), tcid, surveyID]
			query = "insert into survey_response (%s) values (" % ", ".join(columns)
			query += valueCount + ")"
		#return {"query": query, "values": values, "columnCount": len(columns), "valueCount": len(values)}
		cursor.execute(query, values)
	except Exception as e:
		return e
	
	conn.commit()
	return True


def get_hra_score(tcid):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select `Diet & Nutrition`, `Tobacco`, `Physical Activity`, `Stress`, `Preventative Care`, `Overall` from survey_response where tcid = %s", [tcid])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		return dict(zip(desc, result[0]))
	except Exception as e:
		return None
	return None

def get_all_completed_hra_scores():
	cursor = getConnection().cursor()
	try:
		cursor.execute("select `Diet & Nutrition`, `Tobacco`, `Physical Activity`, `Stress`, `Preventative Care`, `Overall` from survey_response where `completed`=1")
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		results = cursor.fetchall()
		scores = []
		for result in results:
			scores.append(dict(zip(desc, result)))
		return scores
	except Exception as e:
		return e
	return None

def get_unscored_hras():
	cursor = getConnection().cursor()
	columns = range(1,80)
	query = "select tcid, " + ", ".join(["`%s`"]*79) + " from survey_response where surveyID='2' and completed='1'"
	#query = "select tcid, " + ", ".join(["`%s`"]*79) + " from survey_response where tcid='0000000001'"
	try:
		cursor.execute(query, columns)
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		data = []
		for r in result:
			data.append([{'tcid': r[0]}, [{'qid': desc[x], 'aid':r[x]} for x in range(1, len(desc))]])
		return data
	except Exception as e:
		return e

def get_hra_data_for_account(account):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select * from survey_response where tcid in (select tcid from webappusers where Account=%s);", [account])
		desc = []
		results = []
		for d in cursor.description:
			desc.append(d[0])
		data = cursor.fetchall()
		for datum in data:
			results.append(dict(zip(desc, datum)))
		return results
	except Exception as e:
		return e

def get_hra_filename(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select surveyID from survey_response where tcid = %s order by DATE_CREATED desc", [tcid])
		sid = cursor.fetchall()[0][0]
		cursor.execute("select filename from survey where surveyID=%s", [sid])
		return cursor.fetchall()[0][0]
	except Exception as e:
		return None
	return None

def get_hra_sid(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select surveyID from survey_response where tcid = %s order by DATE_CREATED desc", [tcid])
		return cursor.fetchall()[0][0]
	except Exception as e:
		return None
	return None


def set_to_spanish(tcid):
	#get the connection cursor
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select count(*) from survey_response where tcid=%s", [tcid])
		c = cursor.fetchall()[0][0]
		if c > 0:
			cursor.execute("update survey_response set surveyID='3' where tcid=%s", [tcid])
		else:
			cursor.execute("insert into survey_response (USER_CREATED, DATE_CREATED, tcid, surveyID) values (%s, %s, %s, '3')", [get_user_with_tcid(tcid)['email'], dt.now(), tcid])
	except Exception as e:
		return e
	
	conn.commit()
	return True

def set_to_english(tcid):
	#get the connection cursor
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select count(*) from survey_response where tcid=%s", [tcid])
		c = cursor.fetchall()[0][0]
		if c > 0:
			cursor.execute("update survey_response set surveyID='4' where tcid=%s", [tcid])
		else:
			cursor.execute("insert into survey_response (USER_CREATED, DATE_CREATED, tcid, surveyID) values (%s, %s, %s, '4')", [get_user_with_tcid(tcid)['email'], dt.now(), tcid])
	except Exception as e:
		return e
	
	conn.commit()
	return True


def user_did_complete_hra(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		query = "select completed from survey_response where tcid = %s"
		cursor.execute(query, [tcid])
		result = cursor.fetchall()[0][0]
		if result == 1:
			return True
	except Exception as e:
		return False
	return False


def get_hra_results_old(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select * from hra_answers where tcid = %s", [tcid])
		#build the return dict
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) != 1:
			return None
		return dict(zip(desc, result[0]))
	except Exception as e:
		return None
	return None	

def get_hra_results(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select * from survey_response where tcid = %s", [tcid])
		#build the return dict
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		result = cursor.fetchall()
		if len(result) != 1:
			return None
		return dict(zip(desc, result[0]))
	except Exception as e:
		return None
	return None	


def get_hra_data(columns=[]):
	conn = getConnection()
	cursor = conn.cursor()
	column_string = ""
	for c in columns:
		column_string += "%s, "
	column_string = column_string[:-2]
	query = "select %s from hra_answers" % ", ".join(columns)
	try:
		cursor.execute(query)
		#build the return dict
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		return [desc, list(cursor.fetchall())]
	except Exception as e:
		return None
	return None


def get_all_hra_results():
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select * from hra_answers")
		#build the return dict
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		results = [desc, list(cursor.fetchall())]
		
		return results
	except Exception as e:
		return None
	return None


#def insert_survey_response(columns, column_values):
#	conn = getConnection()
#	cursor = conn.cursor()
#	try:
#		columnCount = "%s"
#		for i in range(len(columns)-1):
#			columnCount += ", %s"
#		values = column_values.split(", ")
#		query = "insert into survey_response (surveyID, %s) values (" % ", ".join(columns)
#		query += "2, " + columnCount + ")"
#		#return {'query': query, 'values': values}
#		#return {"columnCount": len(columnCount.split(", ")), "columns": len(columns), "column_values": len(column_values.split(", ")), "values": values}
#		if cursor.execute(query, values) != 1:
#			return False
#	except Exception as e:
#		return e
#	
#	conn.commit()
#	return True


def update_hra_score(tcid, scores):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("update survey_response set `Diet & Nutrition`=%s, `Tobacco`=%s, `Physical Activity`=%s, `Stress`=%s, `Preventative Care`=%s, `Overall`=%s where tcid=%s", [scores['Diet & Nutrition'], scores['Tobacco'], scores['Physical Activity'], scores['Stress'], scores['Preventative Care'], scores['Overall'], tcid])
	except Exception as e:
		return e
	conn.commit()
	return True

def get_survey_tcids():
	cursor = getConnection().cursor()
	try:
		cursor.execute("select tcid from survey_response")
		return cursor.fetchall()
	except Exception as e:
		return e
	return None

def complete_hra(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("update survey_response set completed=1 where tcid=%s", [tcid])
	except Exception as e:
		return e
	conn.commit()
	return True

def get_user_address(tcid):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select CONCAT_WS(' ', first_name, last_name) AS Name, Address1, Address2, City, State, PostalCode from webappusers where tcid = %s", [tcid])
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		
		return dict(zip(desc, cursor.fetchall()[0]))
	except Exception as e:
		return e

