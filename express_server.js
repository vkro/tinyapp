const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.ca'
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'thepassword'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: "anotherpassword"
  }
};

const generateRandomString = function () {
  let randomString = Math.floor(Math.random() * 2176782336).toString(36); // 2176782336 min base10 number to guarantee 6 digits from Math.random in base36. Using base 36 means in addition to 0-9, all letters of the alphabet will be used to rep numbers (like HEX).
  return randomString.substr(1, 6);
};

const emailAlreadyRegistered = function(newEmail) {
  for(const user of Object.keys(users)) {
    if (newEmail === users[user]['email']) {
      return true;
    }
  }
  return false;
}


app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {  
  res.render('register');
})

app.get('/urls', (req, res) => {
  let userID = req.cookies['user_id'];
  let currentUser = users[userID];
  let templateVars = { urls: urlDatabase, user: currentUser }; // variables sent to an EJS template need to be sent inside an object, so that we can access the data w/ a key
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies['username'] }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies['username'] };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);           // redirect to shortURL page
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (newEmail === "" || newPassword === "" || emailAlreadyRegistered(newEmail)) {
    res.sendStatus(400);
  } else {
    users[newUserID] = {
      'id': newUserID,
      'email': newEmail,
      'password': newPassword
    }
    res.cookie('user_id', newUserID);
    res.redirect(`/urls`);
  }
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  console.log(req.body);
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = (req.body.newURL);
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});