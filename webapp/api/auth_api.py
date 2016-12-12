import base64
from functools import wraps
from flask_login import LoginManager, current_user, login_required
from flask import abort, jsonify

from webapp import app
from .models.User import User

from webapp.server.util import api_error

# itsdangerous
from itsdangerous import URLSafeSerializer, BadSignature, base64_decode
password_uss = URLSafeSerializer(
    app.config['SECRET_KEY'],
    salt='password_reset'
)
registration_uss = URLSafeSerializer(
    app.config['SECRET_KEY'],
    salt='registration'
)

# init Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.auth_app'
login_manager.session_protection = "strong"


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
    user = User.query.filter_by(tcid=userid).first()
    if not user:
        abort(404)
    return user


@login_manager.request_loader
def load_user_from_request(request):
    # try to login using the Token in Basic Auth Headers
    auth_token = request.headers.get('Authorization')
    if auth_token:
        auth_token = base64_decode(auth_token.replace('Basic ', '', 1))
        user = User.verify_auth_token(auth_token)
        if user:
            return user
        else:
            api_error(ValueError, "Authorization denied.", 401)
    # No authentication, no user
    return None


def getAuthToken(request):
    user_creds = request.headers.get('Authorization')
    if user_creds is None:
        user_creds = request.headers.get('authorization')
    if user_creds:
        user_creds = base64_decode(user_creds.replace('Basic ', '', 1))
        email, pw = user_creds.split(':')
        if email is None or email is '' or pw is None or pw is '':
            api_error(ValueError, "Authorization values are missing.", 400)
        user = User.query.filter_by(email=email).first()
        if user is None:
            api_error(
                ValueError,
                "We could not find a user with the provided email address.",
                404
            )
        return jsonify(jwt=user.authenticate(pw))
    api_error(
        AttributeError,
        "Authorization Headers are missing.",
        401
    )
