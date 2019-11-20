const PORT = 8080; //default port 8080
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { emailAlreadyRegistered } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { urlsForUser } = require('./helpers');
const { whoseUrlIsThis } = require('./helpers');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['637972591', '962198545']
}));


// URL and User Databases

const urlDatabase = {};
const users = {};


// GET ROUTES

app.get('/', (req, res) => {
  const templateVars = { loginError: false };
  
  if (!req.session.user_id) {                         // if nobody's logged in
    res.render('login', templateVars);                // send them to the login page
  } else {
    res.redirect('/urls');                                 // otherwise show them their url index
  }
});


app.get('/register', (req, res) => {
  const templateVars = { registrationError: false };  // this will be used later in POST /register route
  
  if (!req.session.user_id) {                         // if nobody's logged in
    res.render('register', templateVars);             // let them register
  } else {
    res.redirect('/urls');                            // otherwise redirect them to their urls index
  }
});

app.get('/login', (req, res) => {
  const templateVars = { loginError: false };         // this will be used later in POST /login route
  
  if (!req.session.user_id) {                         // if nobody's logged in
    res.render('login', templateVars);                // then let them log in
  } else {
    res.redirect('/urls');                            // otherwise redirect them to their urls index
  }
});


app.get('/urls', (req, res) => {
  const currentUser = req.session.user_id;
  // filter urlDatabase for urls owned by currently logged-in user
  const filteredURLs = urlsForUser(currentUser, urlDatabase);
  // ** NOTE TO SELF ** variables sent to an EJS template need to be sent inside an object, so that we can access the data w/ a key
  let templateVars = { urls: filteredURLs, user: users[currentUser] };
  // check if there's someone logged in
  if (!currentUser) {
    // if not, send 403 status code
    res.status(403);
  }
  // render user's urls index - if user isn't logged in, they'll get an Access Denied message instead of url index
  res.render('urls_index', templateVars);
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});


app.get('/urls/new', (req, res) => {
  let templateVarsNew = { user: users[req.session.user_id] };
  let templateVarsLogin = { loginError: true };

  if (req.session.user_id) {                           // if someone's logged in
    res.render('urls_new', templateVarsNew);           // send them to the form to create a new tinyURL
  } else {
    res.status(403);                                   // otherwise send a 403 status code
    res.render('login', templateVarsLogin);            // and show them the login page with a cue that they've made an error
  }
});


app.get('/urls/:shortURL', (req, res) => {
  let userID = req.session.user_id;
  let shortURL = req.params.shortURL;
  let access = false;                                  // access is false unless user and url are verified
  let templateVars = {};

  if (urlDatabase[shortURL] && userID === whoseUrlIsThis(shortURL, urlDatabase)) {    // make sure the shortURL is in the database, and person trying to view this page is the owner of the shortURL
    access = true;                                                                    // if both are true, set access to true
    templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]['longURL'], user: users[userID], date: urlDatabase[shortURL]['dateCreated'], access: access };
  } else if (!access) {                                // if access hasn't been verified, then
    if (!urlDatabase[shortURL]) {                      // if url isn't in database, send 404 status
      res.status(404);
    } else {
      res.status(403);                                 // otherwise, user doesn't own shortURL, so send 403 status
    }
    templateVars = { access: access, user: users[userID] };  // for these two cases, only send access status and userID to template
  }
  res.render('urls_show', templateVars);               // render shortURL page based on value of access variable
});


app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL]) {                         // if this shortURL exists in the database
    const longURL = urlDatabase[shortURL]['longURL'];
    res.redirect(longURL);                             // redirect to the associated longURL
  } else {
    res.status(404);                                   // otherwise send 404 status and redirect to url index
    res.redirect('/urls');
  }
});


// POST ROUTES


app.post('/urls', (req, res) => {                      // create new shortURL
  const shortURL = generateRandomString();             // assign a random 6-digit alpha-numeric string as the shortURL
  const user = req.session.user_id;
  const newURL = {};
  const date = new Date();
  const dateToString = date.toString();

  if (user) {                                          // if user is logged in
    newURL['longURL'] = req.body.longURL;
    newURL['userID'] = user;
    newURL['dateCreated'] = dateToString.substring(4, 15);
    urlDatabase[shortURL] = newURL;                    // add new entry to urlDatabase
    res.redirect(`/urls/${shortURL}`);                 // and redirect to new shortURL page
  } else {
    res.status(403);                                   // otherwise, send 403 status
    res.redirect('/login');                            // and redirect to login page
  }
});


app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPassword = bcrypt.hashSync(req.body.password, 10);
  const templateVars = { registrationError: false };

  if (newEmail === "" || newPassword === "") {         // if email or password fields are blank, send 400 code and redirect back to registration page
    res.status(400);
    res.render('register', templateVars);
  } else if (emailAlreadyRegistered(newEmail, users, () => {
    return true;                                       // check if email is already registered in the user database
  }
  )) {
    templateVars.registrationError = true;             // if email is already registered,
    res.status(403);                                   // send 403 code
    res.render('register', templateVars);              // and render registration page with error message
  } else {
    users[newUserID] = {                               // otherwise, add new user to database and redirect to /urls/new
      'email': newEmail,
      'password': newPassword
    };
    req.session.user_id = newUserID;
    res.redirect('/urls/new');
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const userID = emailAlreadyRegistered(email, users, (userID) => userID);                  // if email is in user database, retrieve userID
  const hashedPW = emailAlreadyRegistered(email, users, (user) => users[user]['password']); // if email is in user database, retreive hashed password
  const templateVars = { loginError: false };

  if (userID) {                               // if the user exists in the database,
    if (bcrypt.compareSync(req.body.password, hashedPW)) {   // verify submitted password against stored hashed password
      req.session.user_id = userID;           // set session cookie
      res.redirect('/urls');                  // and redirect to user's urls index
    }
  }
  templateVars.loginError = true;             // if user doesn't exist yet, or wrong email or password entered
  res.status(403);                            // send 403 status
  res.render('login', templateVars);          // and show login page, with message cueing user that they've entered wrong login info
});


app.post('/urls/:shortURL', (req, res) => {
  let currentUser = req.session.user_id;
  let shortURL = req.params.shortURL;

  if (currentUser === whoseUrlIsThis(shortURL, urlDatabase)) {           // if the person logged in is the owner of this shortURL
    urlDatabase[shortURL]['longURL'] = req.body.newURL;                  // change the longURL stored at this shortURL in the database to their submitted url
    res.redirect(`/urls/${shortURL}`);                                   // and redirect to the shortURL page
  } else {
    res.sendStatus(403);                                                 // otherwise, send 403 status code
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_id === whoseUrlIsThis(shortURL, urlDatabase)) {   // similar thing happening here as in POST /urls/:shortURL (edit)
    delete urlDatabase[req.params.shortURL];                             // except this time delete the corresponding database entry
    res.redirect('/urls');
  } else {
    res.sendStatus(403);
  }
});

app.post('/logout', (req, res) => {                                      // clear the session cookie and go back to login page
  req.session = null;
  res.redirect('login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});