# Set up the Blueprint for this file/namespace
from flask import Blueprint

auth = Blueprint(
    "auth",
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/auth'
)

from . import views
