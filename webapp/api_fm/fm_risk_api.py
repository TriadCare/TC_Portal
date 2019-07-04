import json
from flask import jsonify
from flask.views import MethodView
from flask_login import current_user

from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data
from .models.FM_User import FM_User as User

from .fm_request_util import make_fm_find_request, make_fm_get_request

def label_to_key(label):
    labelParts = label.split(" ")
    labelParts = [p.lower() for p in labelParts]
    return "-".join(labelParts)

def key_to_label(key):
    keyParts = key.split("-")
    keyParts = [word[0].upper() + word[1:] for word in keyParts]
    return " ".join(keyParts)

class FM_Risk_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self):

        measures = make_fm_get_request("measure")

        query = [{'Patient::TcId': current_user.get_tcid()}]
        sort = [{"fieldName": "recordDate", "sortOrder": "descend"}]
        # Get the latest record
        patient_risk = make_fm_find_request("risk", query, record_range=1, sort=sort)[0]

        patient_risk['jsonBiometrics'] = json.loads(patient_risk['jsonBiometrics'])
        patient_risk['jsonRisk'] = json.loads(patient_risk['jsonRisk'])
        
        # Building the Patient Risk Profile
        measures = filter(lambda m: m["isShownOnWeb"] == 1, measures)
        measures = sorted(measures, key=lambda m: m['sortForDisplay'])

        measure_dict = {}
        for m in measures:
            category = label_to_key(m['type'])
            key = label_to_key(m['label'])
            biometric = patient_risk['jsonBiometrics'][key]
            # Get the biometric value for this measure
            value = {
                'units': m['units'],
                'label': m['labelShort'],
                'value': biometric['value'] if 'value' in biometric.keys() else '-',
                'grade': biometric['grade'] if 'grade' in biometric.keys() else '',
                'risk': biometric['risk'] if 'risk' in biometric.keys() else ''
            }

            if category in measure_dict.keys():
                measure_dict[category].append(value)
            else:
                measure_dict[category] = [value]

        composite_risks = []
        for k in measure_dict.keys():
            composite_risks.append({
                'name': k,
                'label': key_to_label(k),
                'risk': patient_risk['jsonRisk'][k],
                'components': measure_dict[k],
                'total': patient_risk['jsonRisk']['total']
            })

        return jsonify(composite_risks)
