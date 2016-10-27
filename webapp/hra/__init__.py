# Set up the Blueprint for this file/namespace
from flask import Blueprint

hra = Blueprint(
    "hra",
    __name__,
    template_folder='templates',
    static_folder='static'
)

from . import views
