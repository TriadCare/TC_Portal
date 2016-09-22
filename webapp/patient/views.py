from webapp import app, csrf
#import Flask and Flask extensions
from flask import render_template
from flask_login import login_required, current_user

#import the Blueprint to register the views
from . import patient

@patient.route('/dashboard')
@login_required
def dashboard():
	return render_template("dashboard.html")