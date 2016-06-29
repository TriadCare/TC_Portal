#Set up the Blueprint for this file/namespace
from flask import Blueprint

api = Blueprint(
	"api", 
	__name__
)

from . import views
