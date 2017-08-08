from flask import jsonify
from flask.views import MethodView
from flask_login import current_user

from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data

from .fm_request_util import make_fm_find_request


class FM_Account_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self, account_id=None):
        authed_accounts = current_user['permissions']['authorized_accounts']
        if len(authed_accounts) == 0:
            return jsonify([])

        # build the Account query from the list of authorized accounts
        query = []
        for a_id in authed_accounts:
            query.append({"AccountId": a_id})

        response = make_fm_find_request("account", query)

        if account_id is not None:
            return jsonify(next(
                (r for r in response if r['AccountId'] == account_id),
                None
            ))

        return jsonify(response)
