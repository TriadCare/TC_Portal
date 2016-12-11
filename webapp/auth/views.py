# import Flask and Flask extensions
from flask import request, render_template

# import Flask LoginManager from Auth API
from ..api.auth_api import getAuthToken

# import the Blueprint to register the views
from . import auth


@auth.route('/', defaults={'path': ''})
@auth.route('/<path:path>')
def auth_app(path):
    return render_template("auth.html")


# Route and handler for user login requests
@auth.route('/api_token', methods=['GET'])
def retrieveJWT():
    return getAuthToken(request)
