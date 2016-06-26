import MySQLdb as mdb
import json
import sys
import os
from datetime import datetime as dt

from flask.ext.login import current_user


# get a connection object with the credentials in the configuration
def getConnection():
	return mdb.connect(
		app.config['DB_SERVER'],
		app.config['DB_USER'],
		app.config['DB_PW'],
		app.config['DB']
	)

def execute_select(query="", args=[]):
	try:
		cursor = getConnection().cursor()
		cursor.execute(query, args)

		log_action({"message": "Successful Select - Query: " + query + " Args: " + str(args)})
		return {"columns": cursor.description, "results": cursor.fetchall()}
	except Exception as e:
		log_action({"error": True, "message": "Failed Select - Query: " + query + " Args: " + str(args) + " Error: " + str(e)})
		return {"error": True, "message": str(e)}

def execute_insert(query="", args=[]):
	try:
		conn = getConnection()
		cursor = conn.cursor()
		cursor.execute(query, args)

		conn.commit()
		log_action({"message": "Successful Insert - Query: " + query + " Args: " + str(args)})
		return {"columns": cursor.description, "results": cursor.fetchall()}
	except Exception as e:
		log_action({"error": True, "message": "Failed Insert - Query: " + query + " Args: " + str(args) + " Error: " + str(e)})
		return {"error": True, "message": str(e)}


# Audit logging to file
def log_action(action=None):
	if "error" in action:
		print "Data Access API", "[" + str(dt.now()) + "]", "<" + view_user() + ">", json.dumps(action)
	else:
		print "Data Access API", "[" + str(dt.now()) + "]", "<" + view_user() + ">", json.dumps(action)
	# Should log user, time, message, and if it's an error, the error type.

# Returns a detailed string representation of the current user, used for logging
def view_user():
	return current_user.tcid + " " + current_user.first_name + " " + current_user.last_name
