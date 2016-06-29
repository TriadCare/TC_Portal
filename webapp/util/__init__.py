#Set up the Blueprint for this file/namespace
from flask import Blueprint

util = Blueprint(
	"util", 
	__name__
)

from . import views