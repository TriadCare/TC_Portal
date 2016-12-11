from .hra_api import HRA_API
from .user_api import User_API

hra_view = HRA_API.as_view('hra_api')
user_view = User_API.as_view('user_api')
