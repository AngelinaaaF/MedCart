var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const app = require("../app");
const session = require("express-session");

//подключение бд
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'user',
  password : 'password',
  database : 'mysite'
});
//проверка на подключение к бд
connection.connect(function (err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
  console.log('Connected to the MySQL server.');
})

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
  if (req.session.loggedin)
  {
    connection.query(
        'SELECT * FROM info_users WHERE id = ?',
        [req.session.user_id],
        function (error, results, fields) {
          if (error) throw error;
          if (results.length>0) {
            res.render('profile', {name: results[0]['name'],
              surname: results[0]['surname'],
              gender: results[0]['gender'],
              birthday: results[0]['birthday'],
              number_phone: results[0]['number_phone']});
          }
          else{
            res.render('/');
          }
        }
    );
  } else {
    // Not logged in
    res.redirect('/');
  }
});
router.post('/profile', function(req, res, next) {
  var name = req.body.name;
  var surname = req.body.surname;
  var gender = req.body.gender;
  var birthday = req.body.birthday;
  var number_phone = req.body.number_phone;
  var user_id = req.session.user_id;


  var query = 'UPDATE info_users SET';
  var params = [];
  if (name) {
    query += ' name = ?,';
    params.push(name);
  }
  if (surname) {
    query += ' surname = ?,';
    params.push(surname);
  }
  if (gender) {
    query += ' gender = ?,';
    params.push(gender);
  }
  if (birthday) {
    query += ' birthday = ?,';
    params.push(birthday);
  }
  if (number_phone) {
    query += ' number_phone = ?,';
    params.push(number_phone);
  }

  query = query.slice(0, -1) + ' WHERE id = ?';
  params.push(user_id);

  connection.query(query, params, function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Error updating profile');
    } else {
      res.redirect('/profile');
    }
  });
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
        res.status(401).send({ message: "Неверный логин или пароль. Повторите попытку" });
      }
    });
  } else {
    // If either the username or password is missing, send the client back to the login page
    res.redirect('/home');
  }
});



//выход
router.get('/logout', (req, res) => {
  // Set cache control headers to prevent browser caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Destroy Session
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
    } else {
      // Redirect the user to the home page
      res.redirect('/login');
    }
  });
});


router.get('/register', function(req, res, next) {
  res.render('register');
});
router.post('/register', (req, res) => {
  // Capture the input fields
  let username = req.body.username;
  let password = req.body.password;

  // Ensure the input fields exist and are not empty
  if (username && password) {
    // Execute SQL query that'll insert the new user into the database
    connection.query('INSERT INTO auth_users (username, password) VALUES (?, ?)', [username, password], function(error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;

      // If the user is successfully registered, redirect to the login page
      res.redirect('/profile');
    });
  } else {
    // If either the username or password is missing, send the client back to the registration page
    res.redirect('/register');
  }
});


module.exports = router;


