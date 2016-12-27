import json
from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime
from webapp import csrf, db
from webapp.api.auth_api import load_user_from_request
from webapp.server.util import api_error, get_request_data
from .models.User import User


class User_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt]

    def get(self, user_id=None):
        print(user_id)
        if user_id is None:
            # Need to narrow scope to AccountID of current user, here.
            # return jsonify(users=[
            #     user.to_json() for user in User.query.all()
            # ])
            return jsonify({})
        else:
            user = User.query.filter_by(userID=user_id).first()
            if user is None:
                api_error(ValueError, "User ID not found.", 404)
            return jsonify(user.to_json())

    # Registering a new user
    # (Registering other users will require another endpoint.
    #  One in which we can authenticate and authorize)
    def post(self):
        # Validated user from request (new user registration)
        new_user_data = User.data_from_request(request)
        # User from DB (preloaded)
        preloaded_user = (
            User.query.filter_by(
                employeeID=new_user_data['employeeID']
            ).first()
            if ('employeeID' in new_user_data) else
            User.query.filter_by(
                tcid=new_user_data['tcid']
            ).first()
        )

        if preloaded_user is None:
            api_error(ValueError, "Provided ID not found.", 404)

        # Make sure found preloaded user is not already registered
        if preloaded_user.is_enabled():
            api_error(ValueError, "User is already registered.", 403)

        # Validate new user registration data against found preloaded user

        # Make sure preloaded DOB and provided DOB match
        if preloaded_user.get_dob() != new_user_data['dob']:
            api_error(
                ValueError,
                "Failed field match: dob",
                400)
        # Make sure email is either not yet set, or matches provided
        if (preloaded_user.get_email() is not None and
                preloaded_user.get_email() != new_user_data['email']):
            api_error(
                ValueError,
                "Failed field match: email",
                400)

        # Ready to update the new user
        preloaded_user.update(new_user_data)
        db.session.commit()

        return jsonify(id=preloaded_user['userID']), 200

    # Update an existing User. Needs Authorization.
    def put(self, user_id):
        user_data = get_request_data(request)
        update_type = 'PASSWORD_SET' if 'password' in user_data else 'API'
        user = load_user_from_request(request, update_type, throws=True)
        if user_id != user.userID:
            api_error(ValueError, "Unauthorized update.", 403)

        user.update(user_data)
        db.session.commit()
        return jsonify(error=False)
