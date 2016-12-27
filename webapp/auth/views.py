# import Flask and Flask extensions
from flask import request, render_template

# import the Blueprint to register the views
from . import auth


@auth.route('/', defaults={'path': ''})
@auth.route('/<path:path>')
def auth_app(path):
    return render_template("auth.html")
