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
from webapp.api.models.Permission import Permission
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User

FM_AUTH = (
    app.config['FM_AUTH_NAME'],
    app.config['FM_AUTH_PW']
)
FM_VISIT_URL = (
    app.config['FM_URL'] +
    app.config['FM_VISIT_LAYOUT']
)


class FM_Visit_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self, record_id=None):
        permissions = Permission.query.filter_by(tcid=current_user.get_tcid())
        authorized_accounts = [p.accountID for p in permissions]
        if len(authorized_accounts) == 0:
            return jsonify([])
        patientIds = [
            user.get_patientID()
            for user in User.query(accountID=authorized_accounts, find=True)
            if user.in_case_management()
        ]
        query_URL = (FM_VISIT_URL + '.json?RFMmax=0')
        r = requests.get(query_URL, auth=FM_AUTH).json()
        if len(r) == 0 or 'data' not in r:
            api_error(ValueError, "Visit not found.", 404)
        data = []
        for index, d in enumerate(r['data']):
            visit = d
            visit[u'recordID'] = r['meta'][index]['recordID']
            if visit['PatientId'] in patientIds:
                data.append(visit)

        return jsonify(data)
