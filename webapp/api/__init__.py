from .auth_api import Auth_API
from .user_api import User_API
from .hra_api import HRA_API
from .email_api import Email_API

auth_view = Auth_API.as_view('auth_api')
user_view = User_API.as_view('user_api')
hra_view = HRA_API.as_view('hra_api')
email_view = Email_API.as_view('email_api')
