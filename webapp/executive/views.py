# import Flask and Flask extensions
from flask import render_template

# import the Blueprint to register the views
from . import executive


@executive.route('/', defaults={'path': ''})
@executive.route('/<path:path>')
def executive(path):
    return render_template("executive.html")
