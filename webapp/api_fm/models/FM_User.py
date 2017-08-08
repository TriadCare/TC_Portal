from passlib.hash import bcrypt
import re
import json
from datetime import datetime

from webapp.api.models.Permission import Permission
from webapp.api.models.Email import isValidEmail
from webapp.server.util import api_error
from ..fm_request_util import (
    make_fm_find_request, make_fm_get_record, make_fm_update_request
)

MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"


# Helper function to strip out non-ascii characters
def to_ascii(s):
    return ''.join([i for i in s if ord(i) < 128])


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
        'recordID', 'first_name', 'last_name', 'preferred_first_name',
        'dob', 'gender', 'hraEligible', 'case_management', 'status',
        'patientID', 'tcid', 'email', 'accountID', 'account',
        'visit_locationID', 'work_locationID', 'permissions', 'roles'
    ]

    __fm_fields__ = {
        'recordId': 'recordID',
        'PatientId': 'patientID',
        'TcId': 'tcid',
        'Status': 'status',
        'Hash': 'hash',
        'Email': 'email',
        'DOB': 'dob',
        'NameFirst': 'first_name',
        'NamePreferredFirst': 'preferred_first_name',
        'NameLast': 'last_name',
        'Gender': 'gender',
        'HraEligible': 'hraEligible',
        'HraEnrolled': 'hraEnrolled',
        'CurrentCaseManagement': 'case_management',
        'AccountId': 'accountID',
        'Account::Name': 'account',
        'EmployeeId': 'employeeID',
        'AccountLocationIdVisitLocation': 'visit_locationID',
        'AccountLocationIdCostCenter': 'billing_locationID',
        'AccountLocationIdWorkLocation': 'work_locationID'
        # 'PtVisitLocation::Name': 'location_visit',
        # 'PtCostCenter::Name': 'location_billing',
        # 'PtWorkLocation::Name': 'location_work'
    }

    __immutable_fields__ = [
        'recordID', 'patientID', 'tcid', 'employeeID', 'accountID',
        'first_name', 'last_name'
    ]

    __registration_fields__ = {
        'id': {
            'required': True,
            'validationFunc': lambda value: value.strip(),
        },
        'id_type': {
            'required': True,
            'validationFunc': lambda value: value,
        },
        'preferred_first_name': {
            'required': False,
            'validationFunc': lambda value: value.strip(),
        },
        'first_name': {
            'required': True,
            'validationFunc': lambda value: value.strip(),
        },
        'last_name': {
            'required': True,
            'validationFunc': lambda value: value.strip(),
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
            'validationFunc': lambda value: value.strip()
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
        self.patientID = str(data['patientID'])
        self.tcid = str(data['tcid'])
        self.hash = str(data['hash'])
        self.dob = str(data['dob'])
        self.first_name = str(to_ascii(data['first_name']))
        self.preferred_first_name = str(to_ascii(data['preferred_first_name']))
        self.last_name = str(to_ascii(data['last_name']))
        self.gender = str(data['gender'])
        self.hraEligible = str(data['hraEligible'])
        self.hraEnrolled = str(data['hraEnrolled'])
        self.case_management = str(data['case_management'])
        self.email = str(data['email'])
        self.accountID = str(data['accountID'])
        self.account = str(data['account'])
        self.visit_locationID = str(data['visit_locationID'])
        self.billing_locationID = str(data['billing_locationID'])
        self.work_locationID = str(data['work_locationID'])
        self.permissions = (
            data['permissions'] if 'permissions' in data.keys() else {}
        )
        self.roles = data['roles'] if 'roles' in data.keys() else []

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

    def get_patientID(self):
        return unicode(self.patientID)  # python 2

    def get_accountID(self):
        return unicode(self.accountID)  # python 2

    def get_locationID(self):
        return unicode(self.visit_locationID)  # python 2

    def get_email(self):
        return self.email

    def get_dob(self):
        return self.dob

    def get_role(self):
        return 'PATIENT'

    def eligibleForHRA(self):
        return self.hraEligible == '1'

    def enrolledInHRA(self):
        return self.hraEnrolled == '1'

    def in_case_management(self):
        return self.case_management == 'Case Management'

    # Returns a User from File Maker based on the search criteria
    @staticmethod
    def query(**kwargs):
        if 'recordID' in kwargs.keys():
            # If we have recordID, short circuit search
            user_data = make_fm_get_record('user', kwargs['recordID'])[0]
            return FM_User({
                FM_User.__fm_fields__[key]: user_data[key]
                for key in user_data.keys() if key in FM_User.__fm_fields__
            })

        record_range = None
        if 'record_range' in kwargs.keys():
            record_range = kwargs['record_range']
            del kwargs['record_range']

        record_offset = None
        if 'record_offset' in kwargs.keys():
            record_offset = kwargs['record_offset']
            del kwargs['record_offset']

        sort = None
        if 'sort' in kwargs.keys():
            sort = kwargs['sort']
            del kwargs['sort']

        user_objects = []
        # if there are more arguments, we need to POST a Find Request
        if len(kwargs.keys()) > 0:
            query = []
            for arg in kwargs.keys():
                # get FM string of field
                key = getFMField(str(arg))
                # make sure we have a list of string values
                value = kwargs[arg]
                value = (
                    [str(item) for item in value]
                    if isinstance(value, list) else [str(value)]
                )
                for v in value:
                    query.append({key: "==" + str(v)})
            user_objects = make_fm_find_request(
                'user',
                query,
                record_range=record_range,
                record_offset=record_offset,
                sort=sort
            )
        # if a simple request, make a GET request
        else:
            user_objects = make_fm_get_request(
                'user',
                record_range=record_range,
                record_offset=record_offset,
                sort=sort
            )

        users = [FM_User({
            FM_User.__fm_fields__[key]: user_data[key]
            for key in user_data.keys() if key in FM_User.__fm_fields__
        }) for user_data in user_objects]

        # Other code depends on a single obj returned, not a list.
        if record_offset == 1 or len(users) == 1:
            return users[0]
        return users

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
        return make_fm_update_request('user', self.recordID, new_data)

    # function to call to verify the user's creds.
    # Provides sanitization via other functions in this file.
    def authenticate(self, password):
        if not self.is_enabled():
            api_error(ValueError, "User is not enabled.", 403)
        # sanitize inputs and validate the user
        if isValidEmail(self.email):
            try:
                if bcrypt.verify(password, self.hash):
                    return True
            except ValueError:
                pass
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
                except Exception:
                    return_dict[k] = v  # None
            else:
                return_dict[k] = v

        return return_dict

    def get_authorized(self):
        permissions = Permission.query.filter_by(tcid=self.get_tcid())
        authorized_accounts = []
        authorized_locations = []
        for p in permissions:
            if p.groupType == 'ACCOUNT':
                authorized_accounts.append(p.groupID)
            elif p.groupType == 'LOCATION':
                authorized_locations.append(p.groupID)
        self.permissions = {
            'authorized_accounts': authorized_accounts,
            'authorized_locations': authorized_locations
        }
        if (len(self.permissions['authorized_accounts']) > 0 or
           len(self.permissions['authorized_locations']) > 0):
            self.roles = ["EXECUTIVE", "PATIENT"]
        else:
            self.roles = ["PATIENT"]
        return True

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
                if field['required']:
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
