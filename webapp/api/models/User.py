from passlib.hash import bcrypt
import re
import json
from datetime import datetime
from itsdangerous import (TimedJSONWebSignatureSerializer,
                          SignatureExpired, BadSignature)

from webapp import app, db
from webapp.server.util import api_error

MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"

jwt_tjwss = TimedJSONWebSignatureSerializer(
    app.config['SECRET_KEY'],
    salt='jwt'
)


def is_sanitary(input):
    if re.match("^[A-Za-z0-9@\.]*$", input):
        return True
    return False


# helper function to sanitize and validate the password. Rules are as follows:
# 1. Between min and max length (globals set at top of file)
# 2. Contains at least one upper and lower case letter, number,
# and special character (including spaces)
def validate_password(password):
    if not re.match(
        "^(?=^.{" + MIN_PASSWORD_LENGTH + "," +
        MAX_PASSWORD_LENGTH + "}$)(?=.*[a-z])(?=.*[A-Z])" +
        "(?=.*[!@#\$\^\\\(\)%&_\-=+*/\.,:;\"'{}\[\]?| ]).*$",
        password
    ):
        return False
    return True


# Account DB Model
class Account(db.Model):
    __table__ = db.Model.metadata.tables['accounts']


# User DB Model
class User(db.Model):
    __table__ = db.Model.metadata.tables['users']

    __public_fields__ = [
        'userID', 'first_name', 'last_name', 'dob',
        'tcid', 'email', 'accountID'
    ]

    __immutable_fields__ = ['userID', 'tcid', 'employeeID', 'accountID']

    __registration_fields__ = {
        'id': {
            'required': True,
            'validationFunction': lambda value: value,
        },
        'id_type': {
            'required': True,
            'validationFunction': lambda value: value,
        },
        'first_name': {
            'required': True,
            'validationFunction': lambda value: value,
        },
        'last_name': {
            'required': True,
            'validationFunction': lambda value: value,
        },
        'dob': {
            'required': True,
            'validationFunction': lambda d: (
                datetime.strptime(d, '%Y-%m-%d').date()
                if isinstance(d, unicode) else d
            )
        },
        'email': {
            'required': True,
            'validationFunction': lambda value: value
        },
        'password': {
            'required': True,
            'validationFunction': lambda pw: (
                str(bcrypt.encrypt(pw)) if validate_password(pw)
                else api_error(
                    ValueError,
                    'Password does not meet complexity requirements.',
                    400
                )
            )
        }
    }

    def __init__(self, data):
        self.tcid = data['tcid']
        self.dob = data['dob']
        self.first_name = data['first_name']
        self.last_name = data['last_name']
        self.email = data['email']
        self.accountID = data['accountID']

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, item):
        if key in User.__immutable_fields__:
            raise TypeError("Cannot change an immutable field: " + k)
        setattr(self, key, item)

    def __repr__(self):
        return '<User %s>' % (self.first_name)

    def __eq__(self, other):
        return (
            self.tcid == other or
            self.tcid == getattr(other, 'tcid', None)
        )

    def __ne__(self, other):
        return (
            self.tcid != other and
            self.tcid != getattr(other, 'tcid', None)
        )

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def is_enabled(self):
        return self.hash is not None

    def get_id(self):
        return unicode(self.userID)

    def get_tcid(self):
        return unicode(self.tcid)  # python 2

    def get_accountID(self):
        return unicode(self.accountID)  # python 2

    def get_email(self):
        return self.email

    def get_dob(self):
        return self.dob

    def get_role(self):
        return 'TRIADCARE_ADMIN'

    # No return, just updates self with provided data
    def update(self, data):
        if data is None or not isinstance(data, dict):
            return
        for k, v in data.iteritems():
            if k in User.__immutable_fields__:
                continue
            k = k if k != 'password' else 'hash'
            self[k] = v
            print(k)
            print(v)
            print(self.to_json())

    # This instance method generates a signed Timed JSON Web Token
    # for use in future API access requests
    def genJWToken(self, expires_in):
        if expires_in is not None:
            jwt_tjwss.expires_in = expires_in
        return jwt_tjwss.dumps(self.to_json())

    # This static method takes a token and returns a User
    @staticmethod
    def verify_auth_token(token):
        try:
            user = jwt_tjwss.loads(token)
        except SignatureExpired:
            api_error(AttributeError, "This token has expired.", 401)
        except BadSignature:
            api_error(ValueError, "Bad Signature was provided.", 400)
        return user

    # function to call to verify the user's creds.
    # Provides sanitization via other functions in this file.
    def authenticate(self, password):
        if not self.is_enabled():
            api_error(ValueError, "User is not enabled.", 403)
        # sanitize inputs and validate the user
        if is_sanitary(self.email):
            if bcrypt.verify(password, self.hash):
                # basic login token expires after 15 minutes
                return self.genJWToken(900)
            else:
                api_error(ValueError, "Unauthorized, Wrong Password.", 401)
        abort(400)

    def to_json(self):
        return_dict = {}
        for k, v in self.__dict__.iteritems():
            if k not in User.__public_fields__:
                continue
            if k == "dob":
                try:
                    return_dict[k] = v.strftime("%m/%d/%Y")
                except:
                    return_dict[k] = None
            else:
                return_dict[k] = v

        return return_dict

    # Validates user data from request
    @staticmethod
    def data_from_request(request):
        user_data = request.data
        user = {}

        if user_data is None or user_data == '':
            user_data = '{}'
        user_data = json.loads(user_data)

        if user_data is None or not isinstance(user_data, dict):
            api_error(AttributeError, "Bad Request", 400)

        for k, field in User.__registration_fields__.iteritems():
            if k in user_data:
                v = user_data[k]
                # Use the registration field's validation/format function
                value = field['validationFunction'](v)
                if (field['required'] and
                   (value is None or value is '')):
                    api_error(
                        ValueError,
                        ("Required field is formatted incorrectly: " + k),
                        400
                    )
                user[k] = value
            else:
                api_error(
                    AttributeError, "Required field is missing: " + k, 400
                )

        # normalize ID (from <TCID or Employee_ID> -> <TCID>)
        user_id = user['id']
        if user['id_type'] == 'employee_id':
            del user['id']
            del user['id_type']
            user['employeeID'] = user_id
        else:
            del user['id']
            del user['id_type']
            user['tcid'] = user_id

        return user
