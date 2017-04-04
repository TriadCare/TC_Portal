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

FM_AUTH = (
    app.config['FM_AUTH_NAME'],
    app.config['FM_AUTH_PW']
)
FM_LOCATION_URL = (
    app.config['FM_URL'] +
    app.config['FM_LOCATION_LAYOUT']
)


class FM_Location_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    __fm_fields__ = [
        "AccountLocationId", "AccountId", "DateStart",
        "DateEnd", "Status", "Name"
    ]

    def get(self, record_id=None):
        permissions = Permission.query.filter_by(tcid=current_user.get_tcid())
        authorized_accounts = [p.accountID for p in permissions]
        if len(authorized_accounts) == 0:
            return []

        query_URL = (FM_LOCATION_URL + ".json?RFMfind=SELECT " +
                     ",".join(FM_Location_API.__fm_fields__) + " WHERE ")
        for accountID in authorized_accounts:
            query_URL += "AccountId%3D" + accountID + " OR "
        query_URL = query_URL[:-len(" OR ")] + '&RFMmax=0'
        r = requests.get(query_URL, auth=FM_AUTH).json()
        if len(r) == 0 or 'data' not in r:
            api_error(ValueError, "Location not found.", 404)
        data = []
        for index, d in enumerate(r['data']):
            location = d
            location[u'recordID'] = r['meta'][index]['recordID']
            data.append(location)

        return jsonify(data)
