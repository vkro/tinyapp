// Helper functions for tinyApp

const emailAlreadyRegistered = function(email, userDatabase, emailFoundCallback) {
  for (const user of Object.keys(userDatabase)) {
    if (email === userDatabase[user]['email']) {
      return emailFoundCallback(user);
    }
  }
  return undefined;
}

const generateRandomString = function() {
  let randomString = Math.floor(Math.random() * 2176782336).toString(36); // 2176782336 min base10 number to guarantee 6 digits from Math.random in base36. Using base 36 means in addition to 0-9, all letters of the alphabet will be used to rep numbers (like HEX).
  return randomString.substr(1, 6);
};

const urlsForUser = function(userID, database) {
  let filteredURLs = {};
  for (const url of Object.keys(database)) {
    if (database[url]['userID'] === userID) {
      filteredURLs[url] = database[url];
    }
  }
  return filteredURLs;
}


const whoseUrlIsThis = function(shortURL, database) {
  return database[shortURL]['userID'];
}



module.exports = { emailAlreadyRegistered, generateRandomString, urlsForUser, whoseUrlIsThis };