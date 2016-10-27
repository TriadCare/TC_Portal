from flask import make_response, jsonify, abort
from flask_login import login_required, current_user
from flask.views import MethodView

from ..models.HRA import HRA


class HRA_API(MethodView):

    def get(self, response_id):
        # need to check RoleID here.
        tcid = current_user.get_id()
        if response_id is None:
            return jsonify([
                hra.to_dict() for hra in HRA.query.filter_by(tcid=tcid)
            ])
        else:
            return jsonify(HRA.query.filter_by(tcid=tcid)
                           .filter_by(responseID=response_id)
                           .first_or_404().to_dict())
