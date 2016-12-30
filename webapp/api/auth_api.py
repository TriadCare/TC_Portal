import base64
from functools import wraps

from flask_login import LoginManager, current_user, login_required
from flask import request, jsonify
from flask.views import MethodView

from webapp import app, csrf, db
from webapp.server.util import api_error

from webapp.api_fm.models.FM_User import FM_User as User

# init Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.auth_app'
login_manager.session_protection = "strong"

# itsdangerous
from itsdangerous import (TimedJSONWebSignatureSerializer,
                          SignatureExpired, BadSignature, base64_decode)

jwt_tjwss = TimedJSONWebSignatureSerializer(app.config['SECRET_KEY'])

TOKEN_TYPES = {
    'API': {
        'salt': 'api_token',
        'expires_in': 900
    },
    'PASSWORD_SET': {
        'salt': 'password_set_token',
        'expires_in': 300
    }
}


def generate_jwt(payload, token_type='API'):
    token_info = TOKEN_TYPES[token_type]

    jwt_tjwss.salt = token_info['salt']
    jwt_tjwss.expires_in = token_info['expires_in']

    return jwt_tjwss.dumps(payload)


def verify_jwt(token, token_type='API'):
    try:
        token_info = TOKEN_TYPES[token_type]
        jwt_tjwss.salt = token_info['salt']
        payload = jwt_tjwss.loads(token)
    except SignatureExpired:
        api_error(AttributeError, "This token has expired.", 401)
    except BadSignature:
        api_error(ValueError, "Bad Signature was provided.", 400)
    return payload


# Decorator for all views to use to authorize user access
def authorize(*roles):
    def wrapper(f):
        @login_required  # Authenticate
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_role = current_user.get_role()
            if user_role in roles or user_role is "TRIADCARE_ADMIN":
                return f(*args, **kwargs)
            else:
                abort(403)
        return wrapped
    return wrapper


# callback used by Flask-Login to load a user object from a userid in a session
@login_manager.user_loader
def load_user(userid):
    user = User.query(tcid=userid)
    if not user:
        api_error(ValueError, "Could not find user with this ID.", 404)
    return user


@login_manager.request_loader
def load_user_from_request(request, token_type='API', throws=False):
    # try to login using the Token in Basic Auth Headers
    auth_token = request.headers.get('Authorization')
    if auth_token:
        auth_token = base64_decode(auth_token.replace('Basic ', '', 1))
        # Check if the Auth Header is like (username:password), then assume the
        # token is in the 'username' position and discard the other part.
        if ':' in auth_token:
            auth_token = auth_token.split(":")[0]
        user = User.query(
            recordID=verify_jwt(auth_token, token_type)['recordID']
        )
        if user and user.is_enabled():
            return user
        else:
            api_error(ValueError, "Authorization denied.", 401)
    # No authentication, no user
    if throws:
        api_error(
            AttributeError,
            "Required Headers are missing: 'Authorization'",
            400
        )

    return None


class Auth_API(MethodView):
    decorators = [csrf.exempt]

    # Accessed by '/token', can specify TOKEN_TYPE (defaults to API TOKEN)
    def post(self):
        request_data = request.data
        jwt_type = 'API'
        if hasattr(request_data, 'token_type'):
            if request_data['token_type'] in TOKEN_TYPES.keys():
                jwt_type = request_data['token_type']
            else:
                api_error(
                    AttributeError,
                    "Token type missing or unrecognized.",
                    400
                )
        if jwt_type == 'API':
            user_creds = request.headers.get('Authorization')
            if user_creds:
                user_creds = base64_decode(user_creds.replace('Basic ', '', 1))
                email, pw = user_creds.split(':')
                if email is None or email is '' or pw is None or pw is '':
                    api_error(
                        ValueError,
                        "Authorization values are missing.",
                        400
                    )
                user = User.query(email=email)
                if user is None:
                    api_error(
                        ValueError,
                        "We could not find a user with the provided email.",
                        404
                    )
                if user.authenticate(pw):
                    return jsonify(jwt=generate_jwt(user.to_json(), jwt_type))
                return api_error(
                    ValueError,
                    "Could not authenticate User.",
                    500
                )
            api_error(
                AttributeError,
                "Authorization Headers are missing.",
                401
            )
        api_error(AttributeError, "Token type missing or unrecognized.", 400)
