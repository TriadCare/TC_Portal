# Set up the Blueprint for this file/namespace
from flask import Blueprint

executive = Blueprint(
    "executive",
    __name__,
    static_folder='static',
    template_folder='templates',
    static_url_path='/executive'
)

from . import views
