import json

from flask import jsonify, request, render_template
from flask.views import MethodView

from webapp import csrf
from webapp.server.util import api_error, get_request_data
from webapp.api.auth_api import generate_jwt, TOKEN_TYPES
from .models.Email import Email, isValidEmail
# from .models.User import User
from webapp.api_fm.models.FM_User import FM_User as User


def email_forgot_password(email_address):
    if not isValidEmail(email_address):
        api_error(ValueError, "Invalid Email Address.", 400)

    user = User.query(email=email_address)
    if user is None:
        api_error(
            AttributeError,
            "The provided email address could not be found.",
            404
        )
    if not user.is_enabled():
        api_error(
            AttributeError,
            "The provided email address is not yet registered.",
            401
        )
    token = generate_jwt(user.to_json(), 'PASSWORD_SET')
    set_pw_url = request.url_root + 'set?jwt=' + token
    Email({
        'subject': "Reset Your Password for Triad Care Portal",
        'recipients': user.email,
        'body': render_template(
            'emails/forgot_password.txt',
            user_name=user.first_name,
            url=set_pw_url
        ),
        'html': render_template(
            'emails/forgot_password.html',
            user_name=user.first_name,
            url=set_pw_url
        ),
    }).send()

    return jsonify(
        error=False,
        message=('Password Reset Email has been sent to the \
                  provided email address.')
    )


class Email_API(MethodView):
    decorators = [csrf.exempt]

    def get(self):
        api_error(AttributeError, "Unsupported HTTP Method: GET", 405)

    def post(self):
        request_data = get_request_data(request)

        email_type = ""
        try:
            email_type = request_data['email_type']
        except KeyError:
            api_error(
                api_error(
                    AttributeError,
                    "Missing email data: 'email_type'.",
                    400
                )
            )

        if email_type == "forgot_password":
            return email_forgot_password(request_data['email'])
        if email_type == "get_help":
            request_data['subject'] = 'Your Help Request has been Received'
            request_data['recipients'] = request_data['email']
            request_data['cc'] = 'customercare@triadcare.com'
            request_data['html'] = render_template(
                'emails/get_help.html',
                help_data=request_data
            )
            request_data['body'] = render_template(
                'emails/get_help.txt',
                help_data=request_data
            )
            Email.email_from_form(request_data).send()

            return jsonify(
                error=False,
                message=('Help Request has been sent to Customer Care.')
            )

        api_error(
            ValueError,
            "The provided email_type is unsupported.",
            400
        )
