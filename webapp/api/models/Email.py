import re
from flask import current_app

from webapp import app
from webapp.server.util import api_error, async

# Flask-Mail
from flask_mail import Mail, Message
mail = Mail(app)


@async
def send_async_email(app, email_data):
    with app.app_context():
        msg = Message(
            subject=email_data['subject'],
            sender=email_data['sender'],
            recipients=email_data['recipients'],
            cc=email_data['cc'],
            bcc=email_data['bcc'],
            body=email_data['body'],
            html=email_data['html']
        )
        mail.send(msg)


def isValidEmail(email):
    if (
        email is None or
        not (isinstance(email, str) or isinstance(email, unicode))
    ):
        return False
    if re.match('^[^@]+@[^@]+\.[^@]+$', email):
        return True
    return False


class Email():
    __email_fields__ = {
        'subject': {
            'required': True,
            'validationFunction': lambda s: (
                str(s)
                if (s is not None and
                    (isinstance(s, str) or isinstance(s, unicode)))
                else api_error(
                    ValueError,
                    "Subject is required, but is missing.",
                    400
                )
            )
        },
        'sender': {
            'required': False,
            'validationFunction': lambda s: (
                str(s) if isValidEmail(s) else mail.MAIL_DEFAULT_SENDER
            )
        },
        'recipients': {
            'required': True,
            # Must be a string, list not yet supported
            'validationFunction': lambda s: (
                [str(s)]
                if isValidEmail(s)
                else api_error(
                    ValueError,
                    ("'Recipients' field is required, \
                    but is missing or improperly formatted."),
                    400
                )
            )
        },
        'cc': {
            'required': False,
            'validationFunction': lambda s: (
                [str(s)] if isValidEmail(s) else None
            )
        },
        'bcc': {
            'required': False,
            'validationFunction': lambda s: (
                [str(s)] if isValidEmail(s) else None
            )
        },
        'body': {
            'required': True,
            'validationFunction': lambda s: (
                str(s)
                if (s is not None and
                    (isinstance(s, str) or isinstance(s, unicode)))
                else api_error(
                    ValueError,
                    ("'Body' field is required, \
                    but is missing or improperly formatted."),
                    400
                )
            )
        },
        'html': {
            'required': False,
            'validationFunction': lambda s: (
                str(s)
                if (s is not None and
                    (isinstance(s, str) or isinstance(s, unicode)))
                else None
            )
        },
    }

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, item):
        setattr(self, key, item)

    def __init__(self, email_data):
        if (email_data is None or
           not isinstance(email_data, dict) or
           len(email_data) == 0):
            api_error(
                AttributeError,
                "Email data is missing or improperly formatted.",
                400
            )
        for key in self.__email_fields__:
            try:
                form_value = email_data[key]
            except KeyError:
                if self.__email_fields__[key]['required']:
                    api_error(
                        AttributeError,
                        "Required field is missing: " + key,
                        400
                    )
                else:
                    form_value = None

            self[key] = self.__email_fields__[key]['validationFunction'](
                form_value
            )

    def send(self):
        if current_app.config['TESTING']:
            print("\tEMAIL NOTIFICATION:\n \
            \tEmail not sent due to Configuration: TESTING=True")

        send_async_email(app, {
            'subject': self.subject,
            'sender': self.sender,
            'recipients': self.recipients,
            'cc': self.cc,
            'bcc': self.bcc,
            'body': self.body,
            'html': self.html
        })

    @staticmethod
    def bulk_send(email_data):
        api_error(ValueError, "Not set up for bulk emails yet!", 400)

    @staticmethod
    def email_from_form(form):
        return Email(form)
