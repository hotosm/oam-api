const Admin = require('./admin');
const bcrypt = require('bcrypt');

function verifyCredentials (email, password) {
  return Admin.findOne({ 'email': email }).then(admin => {
    if (!admin) {
      const doesNotExistError = new Error('Email does not exist');
      throw doesNotExistError;
    } else {
      return bcrypt.compare(password, admin.password).then(passwordMatches => {
        if (!passwordMatches) {
          const passwordError = new Error('Password does not match');
          throw passwordError;
        } else {
          return passwordMatches;
        }
      });
    }
  });
}
module.exports = verifyCredentials;
