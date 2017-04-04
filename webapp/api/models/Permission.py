from webapp import db
from webapp.server.util import api_error


class Permission(db.Model):
    __table__ = db.Model.metadata.tables['permissions']

    def __init__(self, data):
        for k, v in data.iteritems():
            self[k] = v

    def __getitem__(self, key):
        return getattr(self, key)
