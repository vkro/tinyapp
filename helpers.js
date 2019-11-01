// Helper functions for tinyApp

const emailAlreadyRegistered = function(email, userDatabase, emailFoundCallback) {
  for (const user of Object.keys(userDatabase)) {
    if (email === userDatabase[user]['email']) {
      return emailFoundCallback(user);
    }
  }
  return undefined;
}



module.exports = { emailAlreadyRegistered };