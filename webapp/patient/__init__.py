#Set up the Blueprint for this file/namespace
from flask import Blueprint

patient = Blueprint(
	"patient", 
	__name__, 
	template_folder='templates',
	static_folder='static',
	static_url_path='/patient'
)

from . import views
