from .hra_api import HRA_API
hra_view = HRA_API.as_view('hra_api')

from .user_api import User_API
user_view = User_API.as_view('user_api')
