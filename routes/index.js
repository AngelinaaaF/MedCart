var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const session = require("express-session");
const multer = require('multer');


router.use(multer({dest:"public/file/upload"}).single("filedata"));

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

/*///////////////////////////*/

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

          res.render('profile', {
            name: results[0]['name'],
            surname: results[0]['surname'],
            gender: results[0]['gender'],
            birthday: results[0]['birthday'],
            number_phone: results[0]['number_phone']
          });
        }
    );
  } else {
    // Not logged in
    res.redirect('/home');
  }
});

router.post('/profile', function(req, res, next) {

  var name = req.body.name;
  var surname = req.body.surname;
  var gender = req.body.gender;
  var birthday = req.body.birthday;
  var number_phone = req.body.number_phone;
  var user_id = req.session.user_id;
  if (req.session.loggedin) {
    const phoneRegex = /^[0-9]{11}$/;
    const number_phone = req.body.number_phone;
    if (!phoneRegex.test(number_phone)) {
      // Invalid phone number, send an alert message and redirect back to profile page
       res.send('{"error":"Номер телефона введен некорректно"}')
       return;
    }
  }

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
router.get('/visit_doctor', function(req, res, next) {
  // If the user is loggedin
  if (req.session.loggedin) {
    // Output username
    res.render('visit_doctor');
  } else {
    // Not logged in
    res.redirect('/');
  }
});

router.get('/register', function(req, res, next) {
  res.render('register');
});
router.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  // Ensure the input fields exist and are not empty
  if (username && password) {
    // Execute SQL query that'll check if the username already exists
    connection.query('SELECT * FROM auth_users WHERE username = ?', [username], function(error, results, fields) {
      // If there is an issue with the query, output the error
      if (error) throw error;

      // If the query returns any results, it means the username is already taken
      if (results.length > 0) {
        res.status(401).send({ message: "Пользователем с таким логином уже существует." });
      }
      else {
        // If the username is available, execute SQL query to insert the new user into the database
        connection.query('INSERT INTO auth_users (username, password) VALUES (?, ?)', [username, password], function(error, results, fields) {
          // If there is an issue with the query, output the error
          if (error) throw error;
          // If the user is successfully registered, redirect to the login page
          connection.query('SELECT id FROM auth_users WHERE username = ?', [username], function(error, results, fields) {
            connection.query('INSERT INTO info_users (id) VALUES (?)', [results[0]['id']], function(error, results, fields) {
            if (error) throw error;
            });
            connection.query('INSERT INTO info_user_med (id) VALUES (?)', [results[0]['id']], function(error, results, fields) {
              if (error) throw error;
            });
          });
            res.status(200).send({ message: "Регистрация прошла успешно. Войдите в аккаунт" });
        });
      }
    });
  }
  else {
    // If either the username or password is missing, send the client back to the registration page
    res.status(401).send({ message: "Неверный логин или пароль. Повторите попытку" });
  }
});

/*
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


 */
/* Загрузка файла*/
/*router.post('/file/upload', function(req, res, next) {
  if (!req.session.loggedin) {
    // Not logged in
    res.redirect('/');
  }
  let filedata = req.file;
  console.log(filedata);
  if(!filedata){
    res.send("Ошибка при загрузке файла");
  }
  connection.query('INSERT INTO files (user_id, file_path) VALUES (?, ?)', [req.session.user_id, req.file.path],
  function(error, results, fields) {
    // If there is an issue with the query, output the error
    if (error) throw error;
    // If the user is successfully registered, redirect to the login page
    res.redirect('/carta');
  });
  res.redirect('/carta');
});


*/
/* Получить список файлов у пользователя*//*
router.get('/files', function(req, res, next) {
  if (!req.session.loggedin) {
    // Not logged in
    res.redirect('/');
  }
  /*
  * делаем селект из базы данных, получаем file_id отдаем их в ответе списком [1,2,3,4,5,...]
  * Далее в html мы их обрабатываем, то есть делаем запросы /file/{file_id} file_id берем из списка
  * и вопрос как их отобразить
  * *//*
  connection.query('SELECT file_id, file_path FROM files WHERE user_id = ?', [req.session.user_id],
      function(error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;
        res.render('fileList', { files: results });
      });
});
*/
/* Получить файл по id *//*
router.get('/file/:id', function(req, res, next) {
  if (!req.session.loggedin) {
    // Not logged in
    res.redirect('/');
  }
  /*
  * Ходим в базу данных и получаем путь до файла потом с помошью ?? возвращаем файл.
  * *//*
  connection.query('SELECT file_path FROM files WHERE file_id = ? AND user_id = ?', [req.params.id, req.session.user_id],
      function(error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;

        // If the file path was found in the database
        if (results.length > 0) {
          // Send the file back to the client
          res.sendFile(results[0].file_path);
        } else {
          // File not found, send a 404 response
          res.status(404).send('File not found');
        }
      });
});
*/
const pdfThumbnail = require('pdf-thumbnail');
router.get('/carta', function(req, res, next) {
  console.log(req.session)

  // If the user is loggedin
  if (req.session.loggedin) {
          // Query the database for all files uploaded by the user
          connection.query(
              'SELECT files.file_path as file_path, files.file_type as file_type, conclusion.name_conclusion as name_conclusion FROM files left join conclusion on files.id_conclusion = conclusion.id_conclusion where files.user_id =?',
              [req.session.user_id],
               function (error, results, fields) {
                console.log(results)
                if (results.length === 0){
                  res.render('carta', {files:[]});
                  return;
                }

                // Pass the files array to the template
                res.render('carta', {
                  files: results
                // Pass the files variable to the template
                /*res.render('carta', {
                  file: results[0]*/
                });
              }
          );
  } else {
    // Not logged in
    res.redirect('/');
  }
});


router.post('/file/upload', function(req, res, next) {
  // If the user is not logged in, redirect to the home page
  if (!req.session.loggedin) {
    res.redirect('/');
    return;
  }
  let name_conclusion = req.body.name_conclusion;
  let type_conclusion = req.body.type_conclusion;
  let type_doctor = req.body.type_doctor;
  let name_doctor = req.body.name_doctor;
  let data_conclusion = req.body.data_conclusion;
  let filedata = req.file;
  if (!type_conclusion) {
    type_conclusion = null;
  }
  if (!type_doctor) {
    type_doctor = null;
  }
  if (!name_doctor) {
    name_doctor = null;
  }
  if (!data_conclusion) {
    data_conclusion = null;
  }
  console.log(filedata);
  if(!filedata){
    res.send("Ошибка при загрузке файла");
  }
  let path = req.file.path.replace('public\\','');
  let fileType = req.file.originalname.split('.').pop();
  connection.query('INSERT INTO conclusion (name_conclusion, type_conclusion,data_conclusion,type_doctor,name_doctor,user_id) VALUES (?, ?,?,?,?,?)'
      , [name_conclusion,type_conclusion,data_conclusion,type_doctor,name_doctor,req.session.user_id],
      function(error, results, fields)
      {
        if (error) throw error;
  connection.query('SELECT id_conclusion FROM conclusion WHERE name_conclusion = ?',
      [name_conclusion], function(error, results, fields)
      {
          connection.query('INSERT INTO files (user_id, file_path,id_conclusion,file_type) VALUES (?, ?,?,?)'
      , [req.session.user_id, path ,[results[0]['id_conclusion']],fileType],
          function(error, results, fields)
          {
            if (error) throw error;
            res.redirect('/carta');
          });
      });
});
});

module.exports = router;


