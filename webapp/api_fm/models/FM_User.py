from passlib.hash import bcrypt
import re
import json
from datetime import datetime

import requests

from webapp import app
from webapp.api.models.Email import isValidEmail
from webapp.server.util import api_error

MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"

FM_USER_AUTH = (
    app.config['FM_AUTH_NAME'],
    app.config['FM_AUTH_PW']
)
FM_USER_URL = (
    app.config['FM_URL'] +
    app.config['FM_USER_LAYOUT']
)


# helper function to sanitize and validate the password. Rules are as follows:
# 1. Between min and max length (globals set at top of file)
# 2. Contains at least one upper and lower case letter,
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


def getFMField(field):
    for k, v in FM_User.__fm_fields__.iteritems():
        if field == v:
            return k
    return None


# User DB Model
class FM_User():
    __public_fields__ = [
        'recordID', 'first_name', 'last_name', 'dob',
        'tcid', 'email', 'accountID'
    ]

    __fm_fields__ = {
        'recordID': 'recordID',
        'PatientId': 'patientID',
        'TcId': 'tcid',
        'Status': 'status',
        'Hash': 'hash',
        'Email': 'email',
        'DOB': 'dob',
        'NameFirst': 'first_name',
        'NameLast': 'last_name',
        'AccountId': 'accountID',
        'EmployeeId': 'employeeID'
    }

    __immutable_fields__ = [
        'recordID', 'patientID', 'tcid', 'employeeID', 'accountID'
    ]

    __registration_fields__ = {
        'id': {
            'required': True,
            'validationFunc': lambda value: value,
        },
        'id_type': {
            'required': True,
            'validationFunc': lambda value: value,
        },
        'first_name': {
            'required': True,
            'validationFunc': lambda value: value,
        },
        'last_name': {
            'required': True,
            'validationFunc': lambda value: value,
        },
        'dob': {
            'required': True,
            'validationFunc': lambda d: (
                datetime.strptime(d, '%Y-%m-%d').date()
                if isinstance(d, unicode) else d
            )
        },
        'email': {
            'required': True,
            'validationFunc': lambda value: value
        },
        'password': {
            'required': True,
            'validationFunc': lambda pw: (
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
        self.recordID = str(data['recordID'])
        self.tcid = str(data['tcid'])
        self.hash = str(data['hash'])
        self.dob = str(data['dob'])
        self.first_name = str(data['first_name'])
        self.last_name = str(data['last_name'])
        self.email = str(data['email'])
        self.accountID = str(data['accountID'])

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, item):
        if key in FM_User.__immutable_fields__:
            raise TypeError("Cannot change an immutable field: " + k)
        if key in FM_User.__registration_fields__:
            item = FM_User.__registration_fields__[key]['validationFunc'](item)
        # password becomes hash after validationFunc
        key = key if key != 'password' else 'hash'
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
        return self.is_enabled()

    def is_anonymous(self):
        return False

    def is_enabled(self):
        return self.hash is not None and self.hash != ''

    def get_id(self):
        return unicode(self.recordID)

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

    # Returns a User from File Maker based on the search criteria
    @staticmethod
    def query(**kwargs):
        # build the request URL from the provided query parameters
        if 'recordID' in kwargs.keys():
            # If we have recordID, short circuit search
            r = requests.get(
                (FM_USER_URL + "/" + kwargs['recordID'] + ".json"),
                auth=FM_USER_AUTH
            ).json()
        else:
            query_URL = FM_USER_URL + '.json'
            if len(kwargs) > 0:
                query_URL += "?"
                param_iterator = 1
                for arg in kwargs.keys():
                    key = str(arg)
                    value = str(kwargs[arg])
                    query_URL += (
                        "RFMsF" + str(param_iterator) + "=" + getFMField(key) +
                        "&" +
                        "RFMsV" + str(param_iterator) + "=%3D%3D" + value +
                        "&"
                    )
                query_URL = query_URL[:-len("&")]
            r = requests.get(query_URL, auth=FM_USER_AUTH).json()

        if len(r) == 0 or 'data' not in r:
            api_error(ValueError, "User not found.", 404)

        user_data = r['data'][0]
        user_data['recordID'] = r['meta'][0]['recordID']

        return FM_User({
            FM_User.__fm_fields__[key]: user_data[key] for key in user_data
        })

    # No return, just updates self with provided data and commits change to DB
    def update(self, data):
        if data is None or not isinstance(data, dict):
            return
        new_data = {}
        for k, v in data.iteritems():
            if k in FM_User.__immutable_fields__:
                continue
            self[k] = v
            key = k if k != 'password' else 'hash'
            new_data[getFMField(key)] = (
                self[key]
            ) if k != 'dob' else (
                self['dob'].strftime("%m/%d/%Y")
            )
        # Submit new user data to File Maker
        update_URL = FM_USER_URL + '/' + self.recordID + '.json'
        put_data = {"data": [new_data]}
        response = requests.put(update_URL, json=put_data, auth=FM_USER_AUTH)

        if response.status_code == 200:
            if response.json()['info']['X-RESTfm-Status'] == 200:
                return
        api_error(ValueError, 'User Update Failed.', 500)

    # function to call to verify the user's creds.
    # Provides sanitization via other functions in this file.
    def authenticate(self, password):
        if not self.is_enabled():
            api_error(ValueError, "User is not enabled.", 403)
        # sanitize inputs and validate the user
        if isValidEmail(self.email):
            if bcrypt.verify(password, self.hash):
                return True
            else:
                api_error(ValueError, "Unauthorized, Wrong Password.", 401)
        api_error(ValueError, "Unauthorized, Invalid Username", 401)

    def to_json(self):
        return_dict = {}
        for k, v in self.__dict__.iteritems():
            if k not in FM_User.__public_fields__:
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

        for k, field in FM_User.__registration_fields__.iteritems():
            if k in user_data:
                v = user_data[k]
                # Use the registration field's validation/format function
                value = field['validationFunc'](v)
                if (field['required'] and
                   (value is None or value is '')):
                    api_error(
                        ValueError,
                        ("Required field is formatted incorrectly: " + k),
                        400
                    )
                key = k if k != 'password' else 'hash'
                user[key] = value
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
