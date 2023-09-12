import base64
from datetime import datetime, timezone, timedelta
from functools import wraps

# itsdangerous
import jwt

from flask_login import LoginManager, login_user, logout_user
from flask import request, jsonify
from flask.views import MethodView

from webapp import app, csrf, db
from webapp.server.util import api_error

from webapp.api.models.Permission import Permission
from webapp.api_fm.models.FM_User import FM_User as User

# init Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.auth_app'
login_manager.session_protection = "strong"

TOKEN_TYPES = {
    'API': {
        'salt': 'api_token',
        'expires_in': 3600  # 1 hour
    },
    'PASSWORD_SET': {
        'salt': 'password_set_token',
        'expires_in': 1800  # 0.5 hour
    },
    'REGISTRATION': {
        'salt': 'registration_token',
        'expires_in': 259200  # 72 hours
    }
}


def generate_jwt(payload, token_type='API'):
    token_info = TOKEN_TYPES[token_type]
    iat = datetime.now(tz=timezone.utc)
    payload['iat'] = iat
    payload['exp'] = iat + timedelta(0,token_info['expires_in'])

    return jwt.encode(payload, app.config['SECRET_KEY'] + token_info['salt'])


def verify_jwt(token, token_type='API'):
    try:
        token_info = TOKEN_TYPES[token_type]
        payload = jwt.decode(token, app.config['SECRET_KEY'] + token_info['salt'], algorithms="HS256", options={"require": ["exp"]})
    except jwt.ExpiredSignatureError:
        api_error(AttributeError, "This token has expired.", 401)
    except jwt.InvalidSignatureError as e:
        api_error(ValueError, "Bad Signature was provided.", 400)
    return payload


# Decorator for all views to use to authorize user access
def authorize(*roles):
    def wrapper(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user = load_user_from_request(request, throws=True)
            user_role = user.get_role()
            if user_role in roles or user_role == "TRIADCARE_ADMIN":
                return f(*args, **kwargs)
            else:
                api_error(
                    AttributeError,
                    "You are unauthorized to access this endpoint.",
                    403
                )
        return wrapped
    return wrapper


# callback used by Flask-Login to load a user object from a userid in a session
@login_manager.user_loader
def load_user(userid):
    try:
        user = User.query(tcid=userid, record_range=1)
        return user
    except ValueError:
        return None
    return None


@login_manager.request_loader
# throws defaults to False because Flask-Login calls this without knowing args
def load_user_from_request(request, token_type='API', throws=False):
    # try to login using the Token in Basic Auth Headers
    auth_token = request.headers.get('Authorization')
    user = None
    jwtUser = None
    if auth_token:
        auth_token = base64.b64decode(auth_token.replace('Basic ', '', 1)).decode()
        # Check if the Auth Header is like (username:password)
        if ':' in auth_token:
            username = auth_token.split(":")[0]
            password = auth_token.split(":")[1]
            if password != '':  # username:password
                user = User.query(
                    email=username,
                    record_range=1)
                if not user.authenticate(password):
                    api_error(ValueError, "Authentication Failed.", 401)
                else:
                    user.get_authorized()
            else:
                jwtUser = verify_jwt(username, token_type)
                # Most likely a token
                user = User.query(recordID=jwtUser['recordID'], record_range=1)
        else:
            jwtUser = verify_jwt(auth_token, token_type)
            user = User.query(recordID=jwtUser['recordID'], record_range=1)
        if user:
            if 'roles' not in list(user.__dict__.keys()) or len(user.roles) == 0:
                # Copying over authorizations from provided Auth Token
                user.roles = jwtUser['roles']
                user.permissions = jwtUser['permissions']
            login_user(user)
            return user
        else:
            api_error(ValueError, "Authorization denied.", 401)
    # No authentication, no user
    if throws:
        api_error(
            AttributeError,
            "Required Headers are missing: 'Authentication'",
            400
        )

    return None


class Auth_API(MethodView):
    decorators = [csrf.exempt]

    def get(self):
        api_error(AttributeError, "Unsupported HTTP Method: GET", 405)

    # Accessed by '/token/', can specify TOKEN_TYPE (defaults to API TOKEN)
    def post(self):
        request_data = request.data
        jwt_type = 'API'
        if hasattr(request_data, 'token_type'):
            if request_data['token_type'] in list(TOKEN_TYPES.keys()):
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
                user_creds = base64.b64decode(user_creds.replace('Basic ', '', 1)).decode()
                # split with a max split of one to allow ':' character in pw
                email, pw = user_creds.split(':', 1)
                if email is None or email == '' or pw is None or pw == '':
                    api_error(
                        ValueError,
                        "Authorization values are missing.",
                        400
                    )
                user = User.query(email=email, record_range=1)
                if user is None:
                    api_error(
                        ValueError,
                        "We could not find a user with the provided email.",
                        404
                    )
                if user.authenticate(pw):
                    user.get_authorized()
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
