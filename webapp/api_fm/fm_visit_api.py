from flask import jsonify
from flask.views import MethodView
from flask_login import current_user

from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User

from .fm_request_util import make_fm_find_request


class FM_Visit_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self, visit_id=None):
        authed_accounts = current_user['permissions']['authorized_accounts']
        authed_locations = current_user['permissions']['authorized_locations']

        if len(authed_accounts) == 0 and len(authed_locations) == 0:
            return jsonify([])
        # get a list of patients we have access to
        patient_objects = User.query(
            accountID=authed_accounts,
            visit_locationID=authed_locations
        )
        patientIds = [
            user.get_patientID() for user in patient_objects
            if user.in_case_management() and user.is_active()
        ]

        query = []
        for accountID in authed_accounts:
            query.append({'Patient::AccountId': accountID})
        for locationID in authed_locations:
            query.append(
                {'Patient::AccountLocationIdWorkLocation': locationID})
        response = make_fm_find_request("visit", query)

        # filter response data by the patients we have access to
        return_data = []
        for r in response:
            if r['PatientId'] in patientIds:
                return_data.append(r)

        if visit_id is not None:
            return jsonify(next(
                (r for r in return_data if r['PtVisitId'] == visit_id),
                None
            ))

        return jsonify(return_data)
