# Set up the Blueprint for this file/namespace
from flask import Blueprint

patient = Blueprint(
    "patient",
    __name__,
    static_folder='static',
    template_folder='templates',
    static_url_path='/patient'
)

from . import views
