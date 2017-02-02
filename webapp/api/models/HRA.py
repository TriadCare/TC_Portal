import json
import os
from datetime import datetime
from functools import reduce

from webapp import db
from webapp.server.util import api_error


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
        "Diet & Nutrition": "Diet__Nutrition",
        "Physical_Activity": "Physical Activity",
        "Physical Activity": "Physical_Activity",
        "Preventative_Care": "Preventative Care",
        "Preventative Care": "Preventative_Care",
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
    def from_request(data, complete):
        if 'meta' not in data or 'surveyID' not in data['meta']:
            api_error(
                'AttributeError',
                "Required field is missing: meta.surveyID",
                400
            )
        surveyID = data['meta']['surveyID']
        response = data['response']
        score = score_hra(surveyID, response, complete)

        result = {}
        result['surveyID'] = surveyID
        for k, v in score.iteritems():
            result[k] = v
        for k, v in response.iteritems():
            result[k] = v
        return result


def invalid_answer(qid):
    api_error(
        ValueError,
        'Required answer is missing or invalid for QID: ' + qid,
        400
    )


def get_grade(g, response):
    if g is None:
        return None
    if isinstance(g, float):
        return g
    if 'equal' in g.keys():
        return get_grade(
            g['score'] if response[g['qid']] == g['equal'] else g['else'],
            response
        )
    if 'greaterThanOrEqual' in g.keys():
        return get_grade(
            g['score'] if
            int(response[g['qid']]) >= g['greaterThanOrEqual'] else
            g['else'],
            response
        )


def score_hra(surveyID, response, complete):
    score = {key: None for key in HRA.__score_keys__ if key != 'Overall'}
    if complete:
        hra_scores = {}
        hra_def = {}
        cur_dir = os.path.dirname(os.path.realpath(__file__))
        filename = (cur_dir + '/../../static/hra_files/v' +
                    str(surveyID) + '/scores.json')
        with open(filename, 'r') as scores:
            hra_scores = json.load(scores)['scores']

        filename = (cur_dir + '/../../static/hra_files/v' +
                    str(surveyID) + '/english/hra_definition.json')
        with open(filename, 'r') as definition:
            hra_def = json.load(definition)

        hra_sections = hra_def['meta']['sections']

        for section in hra_sections:
            # For each required section
            if section['isRequired']:
                answer_count = 0
                section_name = (HRA.__transform__[section['group']]
                                if section['group'] in
                                HRA.__transform__.keys()
                                else section['group'])
                # iterate through the question numbers (includes grids)
                for qNum in section['question_numbers']:
                    # If Age question, validate the age and continue
                    if qNum == '1':
                        try:
                            age = int(response[qNum])
                            if age > 0 and age < 200:
                                continue
                            else:
                                raise ValueError()
                        except ValueError:
                            invalid_answer(qNum)
                    # get the question as defined
                    question = next(
                        (q for q in hra_def['questions']
                         if q['question_number'] == qNum), None
                    )
                    # and the possible answers for this question
                    # and then validate the response(s) to this question
                    if 'aids' in question:
                        for row in question['rows']:
                            if ((
                                row['qid'] not in response or
                                response[row['qid']] not in question['aids']
                            ) and row['type'] != 'GRID_TEXT'):
                                invalid_answer(row['qid'])
                            # question answer is valid,
                            # add the score to the section
                            if (
                                section['graded'] and
                                question['type'] != 'GRID_TEXT'
                            ):
                                # unravel conditonal score if needed
                                g = get_grade(next(
                                    ans['score'] for ans in
                                    hra_scores[row['qid']]
                                    if ans['aid'] == response[row['qid']]
                                ), response)
                                if g is not None:
                                    score[section_name] = (
                                        g if score[section_name] is None
                                        else score[section_name] + g
                                    )
                                    answer_count = answer_count + 1
                    else:
                        if (
                            question['qid'] not in response or
                            response[question['qid']] not in
                            [a['aid'] for a in question['answers']]
                        ):
                            invalid_answer(question['qid'])
                        # question answer is valid,
                        # add the score to the section
                        if section['graded']:
                            # unravel conditonal score if needed
                            g = get_grade(next(
                                ans['score'] for ans in
                                hra_scores[question['qid']]
                                if ans['aid'] == response[question['qid']]
                            ), response)
                            if g is not None:
                                score[section_name] = (
                                    g if score[section_name] is None
                                    else score[section_name] + g
                                )
                                answer_count = answer_count + 1

                if section['graded']:
                    # Section total / answer count = section avg
                    score[section_name] = (
                        round((score[section_name] / answer_count), 1)
                    )
        # average the section averages to get the Overall score
        score['Overall'] = round(sum(score.values()) / len(score.values()), 1)
        score['completed'] = 1

    if 'Overall' not in score:
        score['Overall'] = None

    return score
