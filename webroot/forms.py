from flask.ext.wtf import Form
from wtforms import StringField
from flask_wtf.html5 import IntegerField
from flask_wtf.html5 import EmailField
from flask_wtf.html5 import DateField
from wtforms.validators import DataRequired, EqualTo

class LoginForm(Form):
	email = StringField('email', validators=[DataRequired()])
	password = StringField('password', validators=[DataRequired()])
	
class RegistrationForm(Form):
	tcid = StringField('tcid', validators=[DataRequired()])
	first_name = StringField('first_name', validators=[DataRequired()])
	last_name = StringField('last_name', validators=[DataRequired()])
	password = StringField('password', validators=[DataRequired(), EqualTo('confirm_password', message='Passwords must match')])
	confirm_password = StringField('confirm_password', validators=[DataRequired()])
	email = EmailField('email', validators=[DataRequired()])
	dob = DateField('dob', validators=[], format='%Y-%m-%d')
	
class HRAForm(Form):
	pass