import json
import datetime
from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime
from webapp import csrf
from webapp.api.auth_api import load_user_from_request
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User


class FM_User_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt]

    def get(self, record_id=None):
        if record_id is None:
            # Need to narrow scope to AccountID of current user, here.
            # return jsonify(users=[
            #     user.to_json() for user in User.query.all()
            # ])
            return jsonify({})
        else:
            user = User.query(recordID=record_id, first=True)
            if user is None:
                api_error(ValueError, "User ID not found.", 404)
            return jsonify(user.to_json())

    # Registering a new user
    # (Registering other users will require another endpoint.
    #  One in which we can authenticate and authorize)
    def post(self):
        # Validated user from request (new user registration)
        new_user_data = User.data_from_request(request)
        provided_dob = new_user_data['dob'].strftime('%m/%d/%Y')
        # User from DB (preloaded)
        preloaded_user = None
        if 'employeeID' in new_user_data:
            users_with_eID = User.query(employeeID=new_user_data['employeeID'])
            if len(users_with_eID) == 0:
                api_error(ValueError, "Provided ID not found.", 404)
            if len(users_with_eID) > 1:
                # narrow records by matching DOB
                users_with_eID = [
                    user
                    for user in users_with_eID
                    if user.get_dob() == provided_dob
                ]
                if len(users_with_eID) == 0:
                    api_error(
                        ValueError,
                        ("Please check both ID and Date of Birth."),
                        404
                    )
                if len(users_with_eID) > 1:
                    # narrow records by matching Last Name
                    users_with_eID = [
                        user
                        for user in users_with_eID
                        if user['last_name'] == new_user_data['last_name']
                    ]
                    if len(users_with_eID) == 0:
                        api_error(
                            ValueError,
                            ("Please check both ID and Last Name."),
                            404
                        )
                    if len(users_with_eID) > 1:
                        # If still more than one user, abort
                        api_error(
                            ValueError,
                            ("Please contact Customer Support to \
                            complete registration."),
                            404
                        )
            preloaded_user = users_with_eID[0]
        else:
            preloaded_user = (
                User.query(tcid=new_user_data['tcid'], first=True)
            )
            if preloaded_user is None:
                api_error(ValueError, "Provided ID not found.", 404)

        # Make sure the found preloaded user is not already registered
        if preloaded_user.is_enabled():
            api_error(ValueError, "User is already registered.", 403)

        # Validate new user registration data against found preloaded user

        # Make sure preloaded DOB and provided DOB match
        if preloaded_user.get_dob() != provided_dob:
            api_error(ValueError,
                      "Failed field match: dob",
                      400)
        # Make sure preloaded Last Name and provided Last Name match
        if preloaded_user['last_name'] != new_user_data['last_name']:
            api_error(ValueError,
                      "Failed field match: last_name",
                      400)
        else:
            del new_user_data['last_name']
        # If provided First Name does not match what we have,
        # put it in the Preferred First Name field
        if 'first_name' in new_user_data:
            if preloaded_user['first_name'] != new_user_data['first_name']:
                new_user_data['preferred_first_name'] = (
                    new_user_data['first_name']
                )
            del new_user_data['first_name']
        # Make sure email is either not yet set, or matches provided
        preloaded_email = preloaded_user.get_email()
        if (preloaded_email is None or preloaded_user.get_email() == ''):
            # check that the provided email does not yet exist in the database
            try:
                user_with_email = User.query(
                    email=new_user_data['email'],
                    first=True
                )
                if user_with_email is not None:
                    api_error(
                        AttributeError,
                        "This email has already been registered.",
                        401
                    )
            except ValueError:  # no users found with this email
                pass  # this is email is unique
        elif (preloaded_email != new_user_data['email']):
            # If the email has been preloaded for this user,
            # make sure the provided email matches
            api_error(ValueError,
                      "Failed field match: email",
                      400)
        # Ready to update the new user
        preloaded_user.update(new_user_data)
        # db.session.commit()

        return jsonify(id=preloaded_user['recordID']), 200

    # Update an existing User. Needs Authorization.
    def put(self, record_id):
        user_data = get_request_data(request)
        update_type = 'PASSWORD_SET' if 'password' in user_data else 'API'
        user = load_user_from_request(request, update_type, throws=True)

        if record_id != user.recordID:
            api_error(ValueError, "Unauthorized update.", 403)

        user.update(user_data)
        # db.session.commit()
        return jsonify(error=False)
