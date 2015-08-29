import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'webroot'))
import index
	
application = index.app

