import json
import datetime
from flask import jsonify, request
from flask.views import MethodView
from flask_login import current_user
from datetime import datetime
import requests

from webapp import app
from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User

FM_AUTH = (
    app.config['FM_AUTH_NAME'],
    app.config['FM_AUTH_PW']
)
FM_BIOMETRIC_URL = (
    app.config['FM_URL'] +
    app.config['FM_BIOMETRIC_LAYOUT']
)


class FM_Biometric_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    __fm_fields__ = [
        "PtBiometricId", "PatientId", "Dt", "Verified",
        "Patient::AccountId", "Patient::AccountLocationIdVisitLocation"
    ]

    def get(self, record_id=None):
        authed_accounts = current_user['permissions']['authorized_accounts']
        authed_locations = current_user['permissions']['authorized_locations']

        if (len(authed_accounts) == 0
           and len(authed_locations) == 0):
            return jsonify([])
        patientIds = [
            user.get_patientID() for user in User.query(
                accountID=authed_accounts,
                visit_locationID=authed_locations,
                find=True
            )
        ]
        query_URL = (FM_BIOMETRIC_URL + ".json?RFMfind=SELECT " +
                     ",".join(FM_Biometric_API.__fm_fields__) + " WHERE ")
        for accountID in authed_accounts:
            query_URL += "Patient::AccountId%3D" + accountID + " OR "
        for locationID in authed_locations:
            query_URL += ("Patient::AccountLocationIdVisitLocation%3D" +
                          locationID + " OR ")
        query_URL = query_URL[:-len(" OR ")] + '&RFMmax=0'
        r = requests.get(query_URL, auth=FM_AUTH).json()
        if len(r) == 0 or 'data' not in r:
            api_error(ValueError, "Biometric not found.", 404)
        data = []
        for index, d in enumerate(r['data']):
            biometric = d
            biometric[u'recordID'] = r['meta'][index]['recordID']
            if biometric['PatientId'] in patientIds:
                data.append(biometric)

        return jsonify(data)
