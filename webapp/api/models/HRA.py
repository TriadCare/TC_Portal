from datetime import datetime
from webapp import db

import json


class Survey(db.Model):
    __table__ = db.Model.metadata.tables['surveys']


class HRA(db.Model):
    __table__ = db.Model.metadata.tables['responses']

    __private__ = ["_sa_instance_state", "billed", "PaperHra"]

    __meta_keys__ = [
        "responseID", "USER_UPDATED", "DATE_UPDATED", "USER_CREATED",
        "DATE_CREATED", "tcid", "surveyID", "completed"
    ]
    __score_keys__ = [
        "Overall", "Tobacco", "Diet__Nutrition", "Physical_Activity",
        "Stress", "Preventative_Care"
    ]
    __transform__ = {
        "Diet__Nutrition": "Diet & Nutrition",
        "Physical_Activity": "Physical Activity",
        "Preventative_Care": "Preventative Care"
    }

    def __init__(self, data):
        for k, v in data.iteritems():
            self[k] = v

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, item):
        setattr(self, key, item)

    def update(self, data):
        for k, v in data.iteritems():
            self[k] = v

    def to_dict(self, expand=False):
        hra_obj = {}
        meta = {}
        score = {}
        questionnaire = []

        for k, v in self.__dict__.iteritems():
            if k in HRA.__private__:
                continue
            elif k in HRA.__meta_keys__:
                if "DATE_" in k:
                    v = v.isoformat() if v is not None else v
                meta[k] = v
            elif k in HRA.__score_keys__:
                k = (HRA.__transform__[k] if
                     k in HRA.__transform__.keys() else k)
                score[k] = v
            elif k.isdigit():
                questionnaire.append({"qid": k, "aid": v})

        hra_obj['meta'] = meta
        hra_obj['score'] = score
        if expand:
            hra_obj['questionnaire'] = questionnaire
        return hra_obj

    @staticmethod
    def score_hra(data, complete):
        if complete:
            # need to score here
            pass
        return {key: None for key in HRA.__score_keys__}

    @staticmethod
    def from_request(data, complete):
        score = HRA.score_hra(data, complete)
        result = {
            'surveyID': 4
        }
        for k, v in data.iteritems():
            result[k] = v
        return result
