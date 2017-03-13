from .fm_user_api import FM_User_API
from .fm_account_api import FM_Account_API
from .fm_location_api import FM_Location_API
from .fm_biometric_api import FM_Biometric_API
from .fm_visit_api import FM_Visit_API

fm_user_view = FM_User_API.as_view('user_api')
fm_account_view = FM_Account_API.as_view('account_api')
fm_location_view = FM_Location_API.as_view('location_api')
fm_biometric_view = FM_Biometric_API.as_view('biometric_api')
fm_visit_view = FM_Visit_API.as_view('visit_api')
