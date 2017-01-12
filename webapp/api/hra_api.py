from flask import request, make_response, jsonify, url_for
from flask_login import login_required, current_user
from flask.views import MethodView

from ..api.auth_api import authorize
from .models.HRA import HRA
from webapp.api_fm.models.FM_User import FM_User as User


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
    return hra


def get_hra(tcid, response_id, expand=False):
    return make_public(
        HRA.query.filter_by(tcid=tcid)
        .filter_by(responseID=response_id)
        .first_or_404().to_dict(expand)
    )


def get_hras(tcid, expand=False):
    return [
        make_public(hra.to_dict(expand))
        for hra in HRA.query.filter_by(tcid=tcid)
    ]


class HRA_API(MethodView):
    # authorize includes authentication (login_required via Flask-Login)
    decorators = [authorize(['EXECUTIVE', 'TRIADCARE_ADMIN'])]

    def get(self, response_id=None):
        # Note: Only Patient and Provider should have authorization to expand
        expand = (request.args.get('expand', 'false') != 'false')
        tcid = '0000000001'
        # tcid = current_user.get_tcid()
        if response_id is None:
            return jsonify(get_hras(tcid, expand))
        else:
            return jsonify(get_hra(tcid, response_id, expand))

    def post():
        api_error(AttributeError, "Unsupported HTTP Method: GET", 405)
