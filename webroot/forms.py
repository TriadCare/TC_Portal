from flask.ext.wtf import Form
from wtforms import StringField
from flask_wtf.html5 import IntegerField
from flask_wtf.html5 import EmailField
from flask_wtf.html5 import DateField
from wtforms.validators import DataRequired, EqualTo, Regexp

MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"
pw_regex = "^(?=^.{" + MIN_PASSWORD_LENGTH + "," + MAX_PASSWORD_LENGTH + "}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$\^\\\(\)%&_\-=+*/\.,:;\"'{}\[\]?| ]).*$"

class LoginForm(Form):
	email = StringField('email', validators=[DataRequired()])
	password = StringField('password', validators=[DataRequired()])
	
class RegistrationForm(Form):
	tcid = StringField('tcid', validators=[DataRequired()])
	first_name = StringField('first_name', validators=[DataRequired()])
	last_name = StringField('last_name', validators=[DataRequired()])
	password = StringField('password', validators=[DataRequired(), Regexp(pw_regex, message='Please follow password complexity rules.')])
	confirm_password = StringField('confirm_password', validators=[DataRequired(), EqualTo('password', message='Passwords must match')])
	email = EmailField('email', validators=[DataRequired()])
	dob = DateField('dob', validators=[], format='%Y-%m-%d')

class ForgotPasswordForm(Form):
	email = StringField('email', validators=[DataRequired()])

class SetPasswordForm(Form):
	password = StringField('password', validators=[DataRequired(), Regexp(pw_regex, message='Please follow complexity rules.')])
	confirm_password = StringField('confirm_password', validators=[DataRequired(), EqualTo('password', message='Passwords must match')])



class EmptyForm(Form):
	pass