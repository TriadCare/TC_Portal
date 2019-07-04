import json
from flask import jsonify
from flask.views import MethodView
from flask_login import current_user

from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User

from .fm_request_util import make_fm_get_request

def label_to_key(label):
    labelParts = label.split(" ")
    labelParts = [p.lower() for p in labelParts]
    return "-".join(labelParts)

class FM_Measure_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self):
        response = make_fm_get_request("measure")

        # for risk in response:
        #     risk['jsonBiometrics'] = json.loads(risk['jsonBiometrics'])
        #     risk['jsonRisk'] = json.loads(risk['jsonRisk'])

        # Building the Patient Risk Profile
        measures = filter(lambda m: m["isShownOnWeb"] == 1, response)

        # measure_dict = {}
        # for m in measures:
        #     key = label_to_key(m['type'])
        #     if key in measure_dict.keys():
        #         measure_dict[key].append(m)
        #     else:
        #         measure_dict[key] = [m]

        return jsonify(measures)
