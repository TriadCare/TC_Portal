from flask import request, make_response, jsonify, abort
from flask_login import login_required, current_user
from flask.views import MethodView

from ..api.auth_api import authorize
from .models.HRA import HRA
from .models.User import User


class HRA_API(MethodView):
    # authorize includes authentication (login_required via Flask-Login)
    decorators = [authorize(['EXECUTIVE', 'TRIADCARE_ADMIN'])]

    def get(self, response_id):
        if current_user.is_anonymous:
            return "ANON"
        tcid = current_user.get_id()
        print("TCID: " + str(tcid))
        accountID = current_user.get_accountID()
        print("AccountID: " + str(accountID))
        if request.referrer is not None:
            if 'executive' in request.referrer:
                accID = request.args.get('accountID', None)
                if (accID is None or
                   (accID != current_user.get_accountID() and accID != 70)):
                    accID = current_user.get_accountID()
                return jsonify([
                    hra.to_dict()
                    for hra in HRA.query.join(User, HRA.tcid == User.tcid)
                    .filter(User.accountID == accID)
                ])

        # No special referrer, just return current_user's HRAs
        tcid = current_user.get_id()
        if response_id is None:
            return jsonify([
                hra.to_dict() for hra in HRA.query.filter_by(tcid=tcid)
            ])
        else:
            return jsonify(HRA.query.filter_by(tcid=tcid)
                           .filter_by(responseID=response_id)
                           .first_or_404().to_dict())
