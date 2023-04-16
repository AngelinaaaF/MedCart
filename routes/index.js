var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const app = require("../app");
const session = require("express-session");

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'user',
  password : 'password',
  database : 'mysite'
});

router.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/home', function(req, res, next) {
  // If the user is loggedin
  if (req.session.loggedin) {
    // Output username
    res.render('home');

  } else {
    // Not logged in
    res.redirect('/');
  }
});

router.get('/profile', function(req, res, next) {
  console.log(req.session)
  // If the user is loggedin
  if (req.session.loggedin) {
    // Output username

    connection.query(
        'SELECT username FROM auth_users WHERE id = ?',
        [req.session.user_id],
        function (error, results, fields) {
          if (error) throw error;
          res.render('profile', { username: results[0]['username'] });
        }
    );

  } else {
    // Not logged in

    res.redirect('/');
  }
});

router.get('/carta', function(req, res, next) {
  console.log(req.session)
  // If the user is loggedin
  if (req.session.loggedin) {
    // Output username

    connection.query(
        'SELECT username FROM auth_users WHERE id = ?',
        [req.session.user_id],
        function (error, results, fields) {
          if (error) throw error;
          res.render('carta', { username: results[0]['username'] });
        }
    );

  } else {
    // Not logged in
    res.redirect('/');
  }
});

router.get('/login', function(req, res, next) {
  res.render('login');
});
router.post('/login', (req, res) => {
  // Capture the input fields
  let username = req.body.username;
  let password = req.body.password;
  // Ensure the input fields exist and are not empty
  if (username && password) {
    // Execute SQL query that'll select the account from the database based on the specified username and password
    connection.query('SELECT id FROM auth_users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;
      console.log(results);
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.user_id = results[0]['id'];
        res.redirect('/home');
      } else {
        // If the login fails, send an error message to the client
        res.status(401).send({ message: "Invalid login credentials" });
      }
    });
  } else {
    // If either the username or password is missing, send the client back to the login page
    res.redirect('/home');
  }
});



//выход
router.get('/logout', (req, res) => {
  // Destroy the session

  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      // Redirect the user to the home page
      res.redirect('/login');
    }
  });
});

module.exports = router;