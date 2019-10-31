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

const emailAlreadyRegistered = function(email, emailFoundCallback) {
  for(const user of Object.keys(users)) {
    if (email === users[user]['email']) {
      return emailFoundCallback(user);
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

app.get('/login', (req, res) => {  
  res.render('login');
})


app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] }; // variables sent to an EJS template need to be sent inside an object, so that we can access the data w/ a key
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] }
  res.render('urls_new', templateVars);
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
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);           // redirect to shortURL page
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = req.body.password;

  if (newEmail === "" || newPassword === "" || emailAlreadyRegistered(newEmail, () => {return true})) {
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
  const email = req.body.email;
  const pw = req.body.password;
  const userID = emailAlreadyRegistered(email, (user) => {return users[user]['id']});
  const userPW = emailAlreadyRegistered(email, (user) => {return users[user]['password']})
  if (emailAlreadyRegistered(email, () => {return true})) {
    if (userPW === pw) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    }
  }
  res.sendStatus(403); 
});

app.post('/logout', (req, res) => {
  console.log(req.body);
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