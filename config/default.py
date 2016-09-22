#This is the default setting for WTF Cross-Site request Forgery protection, this is redundant.
WTF_CSRF_ENABLED = True
#set to True in dev env, False in prod env.
DEBUG = False
#SQLALCHEMY
SQLALCHEMY_TRACK_MODIFICATIONS = False
#Flask-Webpack
WEBPACK_MANIFEST_PATH = "../bundle/webpack_manifest.json"
WEBPACK_ASSETS_URL = "/bundle/"
