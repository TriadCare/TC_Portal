from flask import make_response, jsonify, abort
from flask_login import login_required
from flask.views import MethodView

from ..models.User import User


class User_API(MethodView):
	
	def get(self, user_id):
		if user_id is None:
			return jsonify(users=[user.to_json() for user in User.query.all()])
		else:
			return jsonify(User.query.filter_by(userID=user_id).first_or_404().to_json())
