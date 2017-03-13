import json
import datetime
from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime
import requests

from webapp import app
from webapp import csrf
from webapp.api.auth_api import load_user_from_request
from webapp.server.util import api_error, get_request_data

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
    decorators = [csrf.exempt]

    def get(self, record_id=None):
        query_URL = FM_BIOMETRIC_URL + '.json?RFMmax=0'
        r = requests.get(query_URL, auth=FM_AUTH).json()
        if len(r) == 0 or 'data' not in r:
            api_error(ValueError, "Biometric not found.", 404)
        data = []
        for index, d in enumerate(r['data']):
            biometric = d
            biometric[u'recordID'] = r['meta'][index]['recordID']
            data.append(biometric)

        return jsonify(data)
