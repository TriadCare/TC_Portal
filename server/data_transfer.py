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

# Rules for Registration:
#	1. If ID_Type is 0 check against the TCID, EmployeeID if 1
#	2. If no record returned, fail
#	3. If a password has already been set, fail
#	4. If there is no stored email AND the given email does not match the stored email, fail
#	5. If the provided DOB does not match the stored DOB, fail
#	6. Otherwise, update with the registered information and pass
def add_user(userDict):
	#get the connection cursor
	conn = getConnection() #holding onto connection so we can commit the additions later
	cursor = conn.cursor()
	try:
		# first check if the tcid already exists in the TCDB
		if userDict['id_type'] == "1":  # Need to look up by EmployeeID
			cursor.execute("select tcid, email, dob, hash from webappusers where employeeID=%s", [userDict['tcid']])
		else: 
			cursor.execute("select tcid, email, dob, hash from webappusers where tcid=%s", [userDict['tcid']])

 		result = cursor.fetchall()
 		
 		if len(result): # already have a record, need to confirm they have their DOB right and don't already have a password
	 		desc = []
	 		for d in cursor.description: #get a list of the column names
				desc.append(d[0])
				
			result = dict(zip(desc, result[0]))
			if result['hash'] is not None:
				return None  # User already has a password, already registered.
			if (result['email'] != None and userDict['email'] != result['email']) or userDict['dob'] != result['dob']:
				return None
		else:  # TCID does not exist.
			return None
		values = [userDict['first_name'], userDict['last_name'], userDict['password'], userDict['email'], userDict['dob'], dt.now(), userDict['email'], result['tcid']]
		if userDict['id_type'] == 1:  # Need to update by EmployeeID
			cursor.execute("update webappusers set first_name=%s, last_name=%s, hash=%s, email=%s, dob=%s, DATE_UPDATED=%s, USER_UPDATED=%s where tcid=%s", values)
		else:
			cursor.execute("update webappusers set first_name=%s, last_name=%s, hash=%s, email=%s, dob=%s, DATE_UPDATED=%s, USER_UPDATED=%s where tcid=%s", values)
	except Exception as e:
		return None
	#if no exceptions, commit the addition
	conn.commit()
	# add the first name and last name, remove the hash, and return the new user
	result['first_name'] = userDict['first_name']
	result['last_name'] = userDict['last_name']
	del result['hash']
	
	return result
	
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



def store_hra_answers(tcid, hra_answers, surveyID, completed, new_record=False, created_by="", paper_hra=0):
	#get the connection cursor
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select count(*) from survey_response where (tcid=%s and surveyID=%s) order by DATE_CREATED desc limit 1", [tcid, surveyID])
		c = cursor.fetchall()[0][0]
		
		valueCount = "%s, %s, %s, %s, %s, %s, "
		columns = ['completed']
		values = ['1'] if completed else ['0']
		for answer in sorted(hra_answers, key=lambda k: k['qid']):
			valueCount += "%s, "
			columns.append("`" + str(answer['qid']) + "`")
			values.append(str(answer['aid']))
		valueCount = valueCount[:-2]
		if c > 0 and not new_record:
			columns[:0] = ['USER_UPDATED', 'PaperHra']
			values[:0] = [created_by if created_by is not "" else get_user_with_tcid(tcid)['email'], paper_hra]
			query = "update survey_response set %s" % "=%s, ".join(columns) + "=%s where (tcid=%s and surveyID=%s) order by DATE_CREATED desc limit 1"
			values += [tcid, surveyID]
		else:
			columns[:0] = ['USER_CREATED', 'DATE_CREATED', 'tcid', 'surveyID', 'PaperHra']
			values[:0] = [(created_by if created_by is not "" else get_user_with_tcid(tcid)['email']), dt.now(), tcid, surveyID, paper_hra]
			query = "insert into survey_response (%s) values (" % ", ".join(columns)
			query += valueCount + ")"
		#print( {"query": query, "values": values, "columnCount": len(columns), "valueCount": len(values)} )
		cursor.execute(query, values)
	except Exception as e:
		print(str(e))
		return False
	
	conn.commit()
	return True

def get_hra_record(response_id):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select * from survey_response where responseID = %s", [response_id])
		#build the return dict
		return_dict = []
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		results = cursor.fetchall()
		return dict(zip(desc, results[0]))
		
	except Exception as e:
		return None
	return None


def get_hra_score(tcid, response_id=-1):
	cursor = getConnection().cursor()
	query = "select `Diet & Nutrition`, `Tobacco`, `Physical Activity`, `Stress`, `Preventative Care`, `Overall` from survey_response where tcid = %s"
	args = [tcid]
	if response_id != -1:
		query += " and responseID = %s" 
		args.append(response_id)
	query += " order by DATE_CREATED desc limit 1"
		
	try:
		cursor.execute(query, args)
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

def get_user_account_name(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select Account from webappusers where tcid = %s", [tcid])
		return cursor.fetchall()[0][0]
	except Exception as e:
		return None
	return None 

def get_latest_hra_date(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		cursor.execute("select DATE_CREATED from survey_response where tcid = %s order by DATE_CREATED desc", [tcid])
		return cursor.fetchall()[0][0]
	except Exception as e:
		return None
	return None 

def get_hra_participation_data_for_account(account, user_id, int_year):
	cursor = getConnection().cursor()
	try:
		query = "select u.first_name, u.last_name, u.email, r.completed from webappusers as u left join survey_response as r on u.tcid=r.tcid where u.Account=%s and r.DATE_CREATED > '%s-01-01 00:00:00' and r.DATE_CREATED < '%s-01-01 00:00:00'"
		cursor.execute(query, [account, int_year, (int_year+1)])
		desc = []
		results = []
		for d in cursor.description:
			desc.append(d[0])
		data = cursor.fetchall()
		for datum in data:
			results.append(dict(zip(desc, datum)))
		return results
	except Exception as e:
		return None

def get_account_count(account):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select COUNT(*) from webappusers where Account=%s", [account])
		result =  cursor.fetchall()[0][0]
		return result
	except Exception as e:
		return None

def get_hra_data_for_account(account):
	cursor = getConnection().cursor()
	try:
		cursor.execute("select * from survey_response where tcid in (select tcid from webappusers where Account=%s) order by DATE_CREATED desc", [account])
		desc = []
		results = []
		for d in cursor.description:
			desc.append(d[0])
		data = cursor.fetchall()
		for datum in data:
			results.append(dict(zip(desc, datum)))
		return results
	except Exception as e:
		return None

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
			cursor.execute("update survey_response set surveyID='3' where tcid=%s order by DATE_CREATED desc limit 1", [tcid])
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
			cursor.execute("update survey_response set surveyID='4' where tcid=%s order by DATE_CREATED desc limit 1", [tcid])
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
		query = "select completed from survey_response where tcid = %s and completed = 1 order by DATE_CREATED desc"
		cursor.execute(query, [tcid])
		result = cursor.fetchall()[0]
		if len(result) > 0:
			return True
	except Exception as e:
		return False
	return False

def latest_is_complete(tcid):
	conn = getConnection()
	cursor = conn.cursor()
	try:
		query = "select completed from survey_response where tcid = %s order by DATE_CREATED desc limit 1"
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

def get_hra_results(tcid, limit_one=True):
	conn = getConnection()
	cursor = conn.cursor()
	
	query = "select * from survey_response where tcid = %s order by DATE_CREATED desc"
	if limit_one:
		query += " limit 1"
	try:
		cursor.execute(query, [tcid])
		#build the return dict
		return_dict = []
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		results = cursor.fetchall()
		if limit_one:
			return dict(zip(desc, results[0]))
		for result in results:
			return_dict.append(dict(zip(desc, result)))
		return return_dict
	except Exception as e:
		return None
	return None	



def get_hra_data(tcid="", columns=[], limit_one=True):
	conn = getConnection()
	cursor = conn.cursor()
	
	query = "select %s from survey_response" % ", ".join(columns)
	query += " where tcid='%s'" % tcid
	if limit_one:
		query += " limit 1"
	try:
		cursor.execute(query)
		#build the return dict
		return_dict = []
		desc = []
		for d in cursor.description: #get a list of the column names
			desc.append(d[0])
		results = cursor.fetchall()
		for result in results:
			return_dict.append(dict(zip(desc, result)))
		return return_dict
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
		cursor.execute("update survey_response set `Diet & Nutrition`=%s, `Tobacco`=%s, `Physical Activity`=%s, `Stress`=%s, `Preventative Care`=%s, `Overall`=%s where tcid=%s order by DATE_CREATED desc limit 1", [scores['Diet & Nutrition'], scores['Tobacco'], scores['Physical Activity'], scores['Stress'], scores['Preventative Care'], scores['Overall'], tcid])
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

