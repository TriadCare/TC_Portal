import sys

activate_this = '/var/www_stage/tc_env/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

sys.path.insert(0, '/var/www_stage/tc_portal')

from webapp import app as application
