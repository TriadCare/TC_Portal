from flask import jsonify
from flask.views import MethodView
from flask_login import current_user

from webapp import csrf
from webapp.api.auth_api import authorize
from webapp.server.util import api_error, get_request_data

from .fm_request_util import make_fm_find_request


class FM_Location_API(MethodView):
    # Decorator list here (auth hook)
    decorators = [csrf.exempt, authorize('PATIENT')]

    def get(self, location_id=None):
        authed_accounts = current_user['permissions']['authorized_accounts']
        authed_locations = current_user['permissions']['authorized_locations']

        if (len(authed_accounts) == 0 and len(authed_locations) == 0):
            return jsonify([])

        # build the query from the list of authorized accounts and locations
        query = []
        for accountID in authed_accounts:
            query.append({'AccountId': accountID})
        for locationID in authed_locations:
            query.append({'AccountLocationId': locationID})

        response = make_fm_find_request("location", query)

        if location_id is not None:
            return jsonify(next(
                (r for r in response if r['AccountLocationId'] == location_id),
                None
            ))

        return jsonify(response)
