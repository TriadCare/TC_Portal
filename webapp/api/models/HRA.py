from webapp import db


class Survey(db.Model):
    __table__ = db.Model.metadata.tables['surveys']


class HRA(db.Model):
    __table__ = db.Model.metadata.tables['responses']

    def __init__(self, data):
        self.responseID = data['responseID']
        self.date_updated = data['date_updated']
        self.tcid = data['tcid']
        self.surveyID = data['surveyID']
        self.completed = data['completed']
        self.paper_hra = data['paperHra']

    def to_dict(self):
        private = ["_sa_instance_state", "billed", "PaperHra"]

        meta_keys = [
            "responseID", "USER_UPDATED", "DATE_UPDATED", "USER_CREATED",
            "DATE_CREATED", "tcid", "surveyID", "completed"
        ]
        score_keys = [
            "Overall", "Tobacco", "Diet & Nutrition", "Physical Activity",
            "Stress", "Preventative Care"
        ]

        hra_obj = {}
        score = {}
        questionnaire = []

        for k, v in self.__dict__.iteritems():
            if k in private:
                continue
            elif k in score_keys:
                score[k] = v
            elif k in meta_keys:
                hra_obj[k] = v
            elif k.isdigit():
                questionnaire.append({"qid": k, "aid": v})

        hra_obj['score'] = score
        hra_obj['questionnaire'] = questionnaire
        return hra_obj
