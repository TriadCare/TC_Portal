# import Flask and Flask extensions
from flask import render_template

# import the Blueprint to register the views
from . import patient


@patient.route('/', defaults={'path': ''})
@patient.route('/<path:path>')
def patient(path):
    return render_template("patient.html")
