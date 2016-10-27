from passlib.hash import bcrypt
import re
from webapp import db


def is_sanitary(input):
    if re.match("^[A-Za-z0-9@\.]*$", input):
        return True
    return False


# Account DB Model
class Account(db.Model):
    __table__ = db.Model.metadata.tables['accounts']


# User DB Model
class User(db.Model):
    __table__ = db.Model.metadata.tables['users']

    def __init__(self, data):
        self.tcid = data['tcid']
        self.dob = data['dob']
        self.first_name = data['first_name']
        self.last_name = data['last_name']
        self.email = data['email']
        self.accountID = data['accountID']

    # function to call to verify the user's creds.
    # Provides sanitization via other functions in this file.
    def authenticate(self, password):
        # sanitize inputs and validate the user
        if is_sanitary(self.email):
            try:
                return bcrypt.verify(password, self.hash)
            except Exception as e:
                # TODO Log and count incorrect password attempt. Limit to three
                return False
        return False

    def to_json(self):
        private = ["hash", "_sa_instance_state"]

        return_dict = {}
        for k, v in self.__dict__.iteritems():
            if k in private:
                continue
            if k == "dob":
                try:
                    return_dict[k] = v.strftime("%m/%d/%Y")
                except:
                    return_dict[k] = None
            else:
                return_dict[k] = v

        return return_dict

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

    def get_id(self):
        return unicode(self.tcid)  # python 2

    def get_email(self):
        return self.email

    def get_role(self):
        return 'executive'
