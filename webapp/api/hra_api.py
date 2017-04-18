from datetime import datetime

from werkzeug.exceptions import NotFound
from flask import request, make_response, jsonify, url_for
from flask_login import current_user
from flask.views import MethodView

from sqlalchemy.sql import func

from webapp import csrf
from webapp.server.util import api_error, get_request_data
from ..api.auth_api import authorize
from .models.Permission import Permission
from .models.HRA import HRA
from webapp.api_fm.models.FM_User import FM_User as User

from webapp import db


def make_public(hra):
    if 'responseID' in hra['meta']:
        new_hra = {}
        for field in hra:
            new_hra[field] = hra[field]
        new_hra['meta']['uri'] = url_for(
            'hra_api',
            response_id=hra['meta']['responseID'],
            _external=True
        )
        return new_hra
    return hra


def get_tc_avg_hra():
    # Would love to cache this...
    # http://flask.pocoo.org/docs/0.12/patterns/caching/
    # http://flask.pocoo.org/docs/0.12/patterns/viewdecorators/
    # if cached_response is not None:
    #     return cached_response
    (Overall, Tobacco, Diet__Nutrition, Physical_Activity,
     Stress, Preventative_Care) = db.session.query(
        func.avg(HRA.Overall),
        func.avg(HRA.Tobacco),
        func.avg(HRA.Diet__Nutrition),
        func.avg(HRA.Physical_Activity),
        func.avg(HRA.Stress),
        func.avg(HRA.Preventative_Care),
    ).filter(HRA.completed == 1).first()

    return [{
        "score": {
            "Overall": round(Overall, 1),
            "Tobacco": round(Tobacco, 1),
            "Diet & Nutrition": round(Diet__Nutrition, 1),
            "Physical Activity": round(Physical_Activity, 1),
            "Stress": round(Stress, 1),
            "Preventative Care": round(Preventative_Care, 1)
        }
    }]


def get_hra(tcid, response_id, expand=False):
    try:
        return [make_public(
            HRA.query.filter_by(tcid=tcid)
            .filter_by(responseID=response_id)
            .first_or_404().to_dict(expand)
        )]
    except NotFound:
        api_error(AttributeError, "HRA not found.", 404)


# TODO: Need Executive authorization here for aggregate access
def get_hras(tcid, expand=False, aggregate=False):
    if aggregate:
        permissions = Permission.query.filter_by(tcid=tcid)
        authorized_accounts = []
        authorized_locations = []
        for p in permissions:
            if p.groupType == 'ACCOUNT':
                authorized_accounts.append(p.groupID)
            elif p.groupType == 'LOCATION':
                authorized_locations.append(p.groupID)

        if len(authorized_accounts) == 0 and len(authorized_locations) == 0:
            return []
        tcids = [
            user.get_tcid() for user in User.query(
                accountID=authorized_accounts,
                visit_locationID=authorized_locations,
                find=True
            )
        ]
        return [
            make_public(hra.to_dict(expand, aggregate))
            for hra in HRA.query.filter(HRA.tcid.in_(tcids))
        ]
    return [
        make_public(hra.to_dict(expand, aggregate))
        for hra in HRA.query.filter_by(tcid=tcid)
    ]


class HRA_API(MethodView):
    # authorize includes authentication (login_required via Flask-Login)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self, response_id=None):
        tcid = current_user.get_tcid()
        # Data Viewing variables
        expand = False
        aggregate = False
        # Note: Only Patient and Provider should have authorization to expand
        expand = (request.args.get('expand', 'false') != 'false')
        # Note: Only Executive and Provider should be authorized to aggregate
        if (not expand):
            aggregate = (request.args.get('aggregate', 'false') != 'false')

        if response_id is None:
            return jsonify(get_hras(tcid, expand, aggregate))
        elif response_id == '-1':
            return jsonify(get_tc_avg_hra())
        else:
            return jsonify(get_hra(tcid, response_id, expand))

    def post(self):
        if not current_user.eligibleForHRA():
            api_error(AttributeError, "User is ineligible for a new HRA.", 403)
        complete = request.args.get('complete', '0') == '1'
        request_data = get_request_data(request)

        hra_data = HRA.from_request(request_data, complete)
        hra_data['tcid'] = current_user.get_tcid()
        hra_data['USER_CREATED'] = current_user.get_email()
        hra_data['DATE_CREATED'] = datetime.now()
        new_hra = HRA(hra_data)

        db.session.add(new_hra)
        db.session.commit()

        current_user.update({'hraEligible': 0})

        return jsonify(id=new_hra.responseID), 201

    def put(self, response_id=None):
        if response_id is None:
            api_error(AttributeError, "Need Record ID for Update.", 400)

        hra = HRA.query.get(response_id)
        if hra.tcid != current_user.get_tcid():
            api_error(AttributeError, "Unauthorized to update this HRA.", 401)

        complete = request.args.get('complete', '0') == '1'
        request_data = get_request_data(request)

        hra_data = HRA.from_request(request_data, complete)
        hra_data['USER_UPDATED'] = current_user.get_email()
        hra_data['DATE_UPDATED'] = datetime.now()

        hra.update(hra_data)
        db.session.commit()

        return jsonify(id=hra.responseID), 200
