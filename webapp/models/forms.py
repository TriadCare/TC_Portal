from flask_wtf import Form
from wtforms import StringField, TextAreaField
from flask_wtf.html5 import IntegerField, EmailField, DateField, TelField
from wtforms.validators import DataRequired, EqualTo, Regexp, Email

import datetime

MIN_PASSWORD_LENGTH = "8"
MAX_PASSWORD_LENGTH = "128"
pw_regex = ("^(?=^.{" + MIN_PASSWORD_LENGTH + "," + MAX_PASSWORD_LENGTH +
            "}$)(?=.*[a-z])(?=.*[A-Z])" +
            "(?=.*[!@#\$\^\\\(\)%&_\-=+*/\.,:;\"'{}\[\]?| ]).*$")


class LoginForm(Form):
    email = StringField('email', validators=[DataRequired()])
    password = StringField('password', validators=[DataRequired()])


class RegistrationForm(Form):
    tcid = StringField('tcid', validators=[DataRequired()])
    first_name = StringField('first_name', validators=[DataRequired()])
    last_name = StringField('last_name', validators=[DataRequired()])
    password = StringField(
        'password',
        validators=[
            DataRequired(),
            Regexp(pw_regex, message='Please follow password complexity rules')
        ]
    )
    confirm_password = StringField(
        'confirm_password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match')
        ]
    )
    email = EmailField('email', validators=[DataRequired()])
    dob_month = IntegerField('dob_month', validators=[DataRequired()])
    dob_day = IntegerField('dob_day', validators=[DataRequired()])
    dob_year = IntegerField('dob_year', validators=[DataRequired()])


class ForgotPasswordForm(Form):
    email = StringField('email', validators=[DataRequired()])


class SetPasswordForm(Form):
    password = StringField(
        'password',
        validators=[
            DataRequired(),
            Regexp(pw_regex, message='Please follow complexity rules')
        ]
    )
    confirm_password = StringField(
        'confirm_password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match')
        ]
    )


class HelpForm(Form):
    name = StringField(
        'name',
        validators=[DataRequired(message='Please enter your name')]
    )
    phone = TelField(
        'phone',
        validators=[DataRequired(message='Please enter your phone number')]
    )
    email = EmailField(
        'email',
        validators=[
            DataRequired(message='Please enter your email address'),
            Email(message='Please enter a valid email address')
        ]
    )
    dob_month = IntegerField('dob_month', validators=[DataRequired()])
    dob_day = IntegerField('dob_day', validators=[DataRequired()])
    dob_year = IntegerField('dob_year', validators=[DataRequired()])
    company = StringField(
        'company',
        validators=[
            DataRequired(message='Please enter the name of your employer')
        ]
    )
    comment = TextAreaField(
        'comment',
        validators=[DataRequired(message='Please enter a detailed comment')]
    )
    dob = {}

    # This is a custom validator to check that the birthdate
    # (three separate fields) are valid
    def validate(self):
        result = True
        if not Form.validate(self):
            # If the form is invalidated, and the date fields are empty,
            # add the DataRequired message to dob
            month = self.dob_month.data
            day = self.dob_day.data
            year = self.dob_year.data

            self.dob['errors'] = []
            empty = False
            if month is None:
                self.dob_month.errors.append(" ")
                empty = True
            if day is None:
                self.dob_day.errors.append(" ")
                empty = True
            if year is None:
                self.dob_year.errors.append(" ")
                empty = True
            if empty:
                self.dob['errors'].append('Please enter a valid date of birth')
    # not valid regardless of empty birthdate because the Form is invalidated
            result = False

            # test if the birthdate is valid
            try:
                user_dob = datetime.datetime.strptime(
                    str(self.dob_month.data) + "/" +
                    str(self.dob_day.data) + "/" +
                    str(self.dob_year.data), "%m/%d/%Y"
                ).date()
            except ValueError:
                self.dob['errors'].append('Please enter a valid date of birth')
                self.dob_month.errors.append('Please enter a valid month')
                self.dob_day.errors.append('Please enter a valid day')
                self.dob_year.errors.append('Please enter a valid year')
                result = False

        return result


class EmptyForm(Form):
    pass
