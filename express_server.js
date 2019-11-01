const express = require('express');
const app = express();
const PORT = 8080; //default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
const { emailAlreadyRegistered } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { urlsForUser } = require('./helpers');
const { whoseUrlIsThis } = require('./helpers');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: '4pdk39' },
  '9sm5xK': { longURL: 'http://www.google.ca', userID: 'j36wu4' },
  'xs2hxK': { longURL: 'https://www.britannica.com/list/the-10-best-types-of-cat', userID: 'j36wu4' }
};

const users = {};


// GET ROUTES

app.get('/', (req, res) => {
  const templateVars = { loginError: false };
  if (!req.session.user_id) {               // if nobody's logged in
    res.render('login', templateVars);      // send them to the login page
  }
  res.render('urls');                    // otherwise send them to their url index
});

app.get('/register', (req, res) => {
  if (!req.session.user_id) {                 // if nobody's logged in
    res.render('register');                   // let them register
  } else {
    res.redirect('/urls');                    // otherwise redirect them to their urls index
  }
});

app.get('/login', (req, res) => {
  const templateVars = { loginError: false }; // include this because POST /login route uses this to signal that user gets a message that they've entered incorrect login info
  if (!req.session.user_id) {                 // if nobody's logged in
    res.render('login', templateVars);        // then let them log in
  } else {
    res.redirect('/urls');                    // otherwise redirect them to their urls index
  }
});


app.get('/urls', (req, res) => {
  const currentUser = req.session.user_id;
  const filteredURLs = urlsForUser(currentUser, urlDatabase);              // filter urlDatabase for urls owned by currently logged-in user
  let templateVars = { urls: filteredURLs, user: users[currentUser] };         // ** NOTE TO SELF ** variables sent to an EJS template need to be sent inside an object, so that we can access the data w/ a key
  if (!currentUser) {                                         // check if there's someone logged in
    res.status(403);                                          // if not, send 403 status code
  }
  res.render('urls_index', templateVars);                     // render user's urls index - if user's not logged in, they'll get an Access Denied pop-up instead
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});


app.get('/urls/new', (req, res) => {
  let templateVarsNew = { user: users[req.session.user_id] };
  let templateVarsLogin = {loginError: true};
  if (req.session.user_id) {                           // if someone's logged in
    res.render('urls_new', templateVarsNew);           // let them access the form to create a new tinyURL
  } else {
    res.status(403);                                   // otherwise end a 403 status code
    res.render('login', templateVarsLogin);            // and send them to the login page with a cue that there's been an error
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let userID = req.session.user_id;
  let shortURL = req.params.shortURL;
  let access = false;                   // access is false unless user and url are verified
  let templateVars = {};

  if (urlDatabase[shortURL] && userID === whoseUrlIsThis(shortURL, urlDatabase)) {    // make sure the shortURL is in the database, and person trying to view this page is the owner of the shortURL
    access = true;                                                       // if both are true, set access to true
    templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]['longURL'], user: users[userID], access: access };
  } else if (!access) {
    if (!urlDatabase[shortURL]) {                                        // if url isn't in database, send 404 status
      res.status(404);
    } else {
      res.status(403);                                                   // otherwise, user doesn't own shortURL, so send 403 status
    }
    templateVars = { access: access, user: users[userID] }
  }
  res.render('urls_show', templateVars);                                 // render shortURL page based on value of access variable
});


app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {                         // if the shortURL exists in the database
    const longURL = urlDatabase[shortURL]['longURL'];
    res.redirect(longURL);                             // redirect to the associated longURL
  } else {
    res.status(404);                                   // otherwise send 404 status and redirect to url index
    res.redirect('/urls');
  }
});

// POST ROUTES

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const user = req.session.user_id;
  const newURL = {};
  if (user) {                                // if user is logged in
    newURL['longURL'] = req.body.longURL;
    newURL['userID'] = user;
    urlDatabase[shortURL] = newURL;          // add new entry to urlDatabase
    res.redirect(`/urls/${shortURL}`);       // and redirect to new shortURL page
  } else {
    res.status(403);                         // otherwise, send 403 status
    res.redirect('/login');                  // and redirect to login page
  }
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = bcrypt.hashSync(req.body.password, 10);

  if (newEmail === "" || newPassword === "" || emailAlreadyRegistered(newEmail, users, () => { return true })) {
    res.status(400);
    res.redirect('/register');
  } else {
    users[newUserID] = {
      'email': newEmail,
      'password': newPassword
    }
    req.session.user_id = newUserID;
    res.redirect(`/urls`);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const pw = req.body.password;
  const userID = emailAlreadyRegistered(email, users, (user) => user);
  const hashedPW = emailAlreadyRegistered(email, users, (user) => { return users[user]['password'] })
  const templateVars = { loginError: false };

  if (userID) {
    if (bcrypt.compareSync(pw, hashedPW)) {   // verify password with stored hashed password
      req.session.user_id = userID;           // set session cookie
      res.redirect('/urls');                  // redirect to urls index
    }
  }
  templateVars.loginError = true;             // if wrong email or password entered
  res.status(403);                            // error code and 
  res.render('login', templateVars);          // go back to login page, displaying message cueing user that wrong login info has been entered
});


app.post('/urls/:shortURL', (req, res) => {
  let currentUser = req.session.user_id;
  let shortURL = req.params.shortURL;

  if (currentUser === whoseUrlIsThis(shortURL, urlDatabase)) {            // if the person logged in is the owner of this shortURL
    urlDatabase[shortURL]['longURL'] = (req.body.newURL);    //let them edit it
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.sendStatus(403);                                    // otherwise, send 403 status code
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_id === whoseUrlIsThis(shortURL, urlDatabase)) {   // same thing happening here as in POST /urls/:shortURL (edit)
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.sendStatus(403);
  }
});

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});