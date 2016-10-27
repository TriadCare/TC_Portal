from webapp import app, csrf
# import Flask and Flask extensions
from flask import render_template
from flask_login import login_required, current_user
# import decorators
from ..util.tc_decorators import required_roles

# import the Blueprint to register the views
from . import executive


@executive.route('/', defaults={'path': ''})
@executive.route('/<path:path>')
@login_required
@required_roles('executive')
def executive(path):
    return render_template("executive.html")
