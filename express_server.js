const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: '4pdk39' },
  '9sm5xK': { longURL: 'http://www.google.ca', userID: 'j36wu4' },
  'xs2hxK': { longURL: 'https://www.britannica.com/list/the-10-best-types-of-cat', userID: 'j36wu4' }
};

const users = {
  '4pdk39': {
    email: 'user@example.com',
    password: 'thepassword'
  },
  'j36wu4': {
    email: 'user2@example.com',
    password: "anotherpassword"
  }
};

const generateRandomString = function () {
  let randomString = Math.floor(Math.random() * 2176782336).toString(36); // 2176782336 min base10 number to guarantee 6 digits from Math.random in base36. Using base 36 means in addition to 0-9, all letters of the alphabet will be used to rep numbers (like HEX).
  return randomString.substr(1, 6);
};

const emailAlreadyRegistered = function (email, emailFoundCallback) {
  for (const user of Object.keys(users)) {
    if (email === users[user]['email']) {
      return emailFoundCallback(user);
    }
  }
  return false;
}

const urlsForUser = function(userID) {
  let filteredURLs = {};
  for (const url of Object.keys(urlDatabase)) {
    if (urlDatabase[url]['userID'] === userID) {
      filteredURLs[url] = urlDatabase[url];
    }
  }
  return filteredURLs;
}

const whoIsLoggedIn = function(cookie) {
    for(const user of Object.keys(users)) {
      if (cookie === user) {
        return user;
      } else {
      return undefined;
      }
    }
  }

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/register', (req, res) => {
  res.render('register');
})

app.get('/login', (req, res) => {
  res.render('login');
})


app.get('/urls', (req, res) => {
  const currentUser = req.cookies['user_id'];
  const filteredURLs = urlsForUser(currentUser);
  let templateVars = { urls: filteredURLs, user: users[currentUser]}; // variables sent to an EJS template need to be sent inside an object, so that we can access the data w/ a key
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] }
  if (req.cookies['user_id']) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect(`/login`);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies['user_id']] };
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
  const user = req.cookies['user_id']
  const newURL = {};
  newURL['longURL'] = req.body.longURL;
  newURL['userID'] = user;
  urlDatabase[shortURL] = newURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);           // redirect to shortURL page
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (newEmail === "" || newPassword === "" || emailAlreadyRegistered(newEmail, () => { return true })) {
    res.sendStatus(400);
  } else {
    users[newUserID] = {
      'email': newEmail,
      'password': newPassword
    }
    res.cookie('user_id', newUserID);
    res.redirect(`/urls`);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const pw = req.body.password;
  const userID = emailAlreadyRegistered(email, (user) => user);
  const userPW = emailAlreadyRegistered(email, (user) => { return users[user]['password'] })
  if (emailAlreadyRegistered(email, () => { return true })) {
    if (userPW === pw) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else res.sendStatus(403);
  } else res.sendStatus(403);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.body.user_id);
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