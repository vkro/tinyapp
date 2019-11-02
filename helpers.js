// Helper functions for tinyApp

const emailAlreadyRegistered = function(email, userDatabase, emailFoundCallback) {
  for (const user of Object.keys(userDatabase)) {           // look for user in the database by the entered email
    if (email === userDatabase[user]['email']) {
      return emailFoundCallback(user);                      // if they're found in the dataabase, return value depends on callback function
    }
  }
  return undefined;                                         // otherwise return undefined
};

const generateRandomString = function() {                                   // 2176782336 min base10 number to guarantee 6 digits from Math.random in base36. Using base 36 means in addition to 0-9, all letters of the alphabet will be used to rep numbers (like HEX).
  let randomString = Math.floor(Math.random() * 2176782336).toString(36); 
  return randomString.substr(1, 6);
};

const urlsForUser = function(userID, database) {
  let filteredURLs = {};
  for (const url of Object.keys(database)) {                // return only the urls from the database for which the userID matches
    if (database[url]['userID'] === userID) {
      filteredURLs[url] = database[url];
    }
  }
  return filteredURLs;
};


const whoseUrlIsThis = function(shortURL, database) {      // retreive userID from this entry in the database
  return database[shortURL]['userID'];
};



module.exports = { emailAlreadyRegistered, generateRandomString, urlsForUser, whoseUrlIsThis };