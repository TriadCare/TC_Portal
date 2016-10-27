from functools import wraps
from flask import abort
from flask_login import current_user


def required_roles(*roles):
    def wrapper(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if current_user.get_role() not in roles:
                return abort(403)
            return f(*args, **kwargs)
        return wrapped
    return wrapper
