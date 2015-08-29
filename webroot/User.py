class User():
	#need TcId, DOB, first_name, last_name, email
	def __init__(self, data):
		self.tcid = data['tcid']
		self.dob = data['dob']
		self.first_name = data['first_name']
		self.last_name = data['last_name']
		self.email = data['email']
	
	def is_authenticated(self):
		return True

	def is_active(self):
		return True

	def is_anonymous(self):
		return False

	def get_id(self):
		return unicode(self.tcid)  # python 2
		

	def __repr__(self):
		return '<User %r>' % (self.first_name)