const { assert } = require('chai');
const { emailAlreadyRegistered } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('emailAlreadyRegistered', function() {
  
  it('should return a user with valid email', function () {
    const user = emailAlreadyRegistered("user@example.com", testUsers, (user) => user)
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });

  it('should return undefined if email is not in user database', function() {
    const user = emailAlreadyRegistered("no@nope.ca", testUsers, (user) => user)
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  })



});


