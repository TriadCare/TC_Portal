from flask import make_response, jsonify, abort
from flask_login import login_required 

import data_access_api

#import the Blueprint to register the views
from . import api

### Account Management API ###

# Account Interface #
@api.route('/manage_account/accounts', methods=['GET'])
def get_accounts():
	return get_respond(data_access_api.execute_select("select * from accounts"))

@api.route('/manage_account/accounts/<int:account_id>', methods=['GET'])
def get_account(account_id):
	return get_respond(data_access_api.execute_select("select * from accounts where accountID = %s", [account_id]))

##### NEED WTF HERE TO CHECK INPUT FORM ####
@api.route('/manage_account/accounts', methods=['POST'])
def create_account():
	if not request.json or not 'name' in request.json or type(request.json['name']) != unicode:
		abort(400)
	post_respond(data_access_api.execute_insert("insert into accounts set name = %s", [request.json['name']]))


# Employee Interface #


# API helper functions #

# This function assumes results is an object - {"columns": cursor.description, "results": cursor.fetchall()
def get_respond(results):
	if len(results['results']) == 0:
		abort(404)
	elif "error" in results and results.error:
		abort(400, results)

	return make_response(jsonify({"accounts": zip_sql_results(results['columns'], results['results'])}), 200)

def post_respond(results):
	pass



def zip_sql_results(description, sql_results):
	desc = []
	for d in description:
		desc.append(d[0])

	result = []
	for r in sql_results:
		result.append(dict(zip(desc, r)))

	return result

# Not Found
@api.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

# Bad Request
@api.errorhandler(400)
def not_found(error):
    return make_response(jsonify({'error': 'Bad Request', "message": error}), 400)


