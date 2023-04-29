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

const pdfThumbnail = require('pdf-thumbnail');
router.get('/carta', function(req, res, next) {
  console.log(req.session)

  // If the user is loggedin
  if (req.session.loggedin) {
          // Query the database for all files uploaded by the user
          connection.query(
              'SELECT files.file_path as file_path, files.file_id as file_id,  files.file_type as file_type, conclusion.name_conclusion as name_conclusion FROM files left join conclusion on files.id_conclusion = conclusion.id_conclusion where files.user_id =?',
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
  let data_conclusion = req.body.data_conclusion;
  let type_doctor  = req.body.type_doctor;
  let filedata = req.file;
  if (!type_conclusion) {
    type_conclusion = null;
  }
  if (!data_conclusion) {
    data_conclusion = null;
  }
  console.log(filedata);
  if(!filedata){
    res.send("Ошибка при загрузке файла");
  }
  //убирам лишний паблик
  let path = req.file.path.replace('public\\','');
  //берем тип
  let fileType = req.file.originalname.split('.').pop();
  connection.query('INSERT INTO conclusion (type_doctor,name_conclusion, type_conclusion,data_conclusion,user_id) VALUES (?,?,?,?,?)'
      , [type_doctor,name_conclusion,type_conclusion,data_conclusion,req.session.user_id],
      function(error, results, fields)
      {
        if (error) throw error;
  connection.query('SELECT id_conclusion FROM conclusion WHERE name_conclusion = ?',
      [name_conclusion], function(error, results, fields)
      {
        let id_conclusion = results[0]['id_conclusion'];
          connection.query('INSERT INTO files (user_id, file_path,id_conclusion,file_type) VALUES (?, ?,?,?)'
      , [req.session.user_id, path ,[results[0]['id_conclusion']],fileType],
          function(error, results, fields)
          {
            if (error) throw error;
            res.redirect('/file/upload/notedata/'+id_conclusion)
          });
      });
});
});
router.get('/file/upload/notedata/:id', function(req, res, next) {
  console.log(req.session)
  if (!req.session.loggedin) {
    res.redirect('/');
    return;
  }
  connection.query(
      'SELECT * FROM conclusion where id_conclusion =?',
      [req.params.id],
      function (error, results, fields) {
        console.log(results)
        if (results.length === 0) {
          res.redirect('carta');
          return;
        }
        if(results[0].user_id!==req.session.user_id){
          res.redirect('carta');

        }
        res.render('notedata' , {
          id_conclusion: req.params.id,
          name_conclusion: results[0]['name_conclusion'],
          type_conclusion: results[0]['type_conclusion'],
          doctor: results[0]['doctor'],
          place_conclusion: results[0]['place_conclusion'],
          comment: results[0]['comment'],
        });
      });
});

router.post('/file/upload/notedata/:id', function(req, res, next) {
  // If the user is not logged in, redirect to the home page
  console.log(req.session)
  if (!req.session.loggedin) {
    res.redirect('/');
    return;
  }
  let name_conclusion = req.body.name_conclusion;
  let comment = req.body.comment;
  let place_conclusion = req.body.place_conclusion;
  let doctor  = req.body.doctor;
  if (!doctor) {
    doctor = null;
  }
  if (!place_conclusion) {
    place_conclusion = null;
  }
  if (!comment) {
    comment = null;
  }
  console.log(req.body)
  console.log("code: ",req.body.code)
  console.log("complaints: ",req.body.complaints)
  let type_info = {};

  if(req.body.code !== undefined){
    type_info['code']=req.body.code
  };
  if(req.body.diagnosis !== undefined){
    type_info['diagnosis']=req.body.diagnosis
  };
  if(req.body.complaints !== undefined){
    type_info['complaints']=req.body.complaints
  };
  if(req.body.diagnosis !== undefined){
    type_info['diagnosis']=req.body.diagnosis
  };
  if(req.body.anamnez !== undefined){
    type_info['anamnez']=req.body.anamnez
  };
  if(req.body.conclusion !== undefined){
    type_info['conclusion']=req.body.conclusion
  };
  if(req.body.prescription !== undefined){
    type_info['prescription']=req.body.prescription
  };
  /**********************************************/
  if(req.body.area !== undefined){
    type_info['area']=req.body.area
  };
  /*******************************************/
  if(req.body.purpose !== undefined){
    type_info['purpose']=req.body.purpose
  };
  if(req.body.todoctor !== undefined){
    type_info['todoctor']=req.body.todoctor
  };
  if(req.body.justification !== undefined){
    type_info['justification']=req.body.justification
  };
  if(req.body.cameto !== undefined){
    type_info['cameto']=req.body.cameto
  };
  /**********************************************/
  if(req.body.number !== undefined){
    type_info['number']=req.body.number
  };
  if(req.body.date_starting !== undefined){
    type_info['date_starting']=req.body.date_starting
  };
  if(req.body.date_finish !== undefined){
    type_info['date_finish']=req.body.date_finish
  };
  /**************************************************/
  if(req.body.allergen !== undefined){
    type_info['allergen']=req.body.allergen
  };
  if(req.body.reaction !== undefined){
    type_info['reaction']=req.body.reaction
  };
  /*********************************************/
  if(req.body.medication !== undefined){
    type_info['medication']=req.body.medication
  };
  if(req.body.dose !== undefined){
    type_info['dose']=req.body.dose
  };
  /*********************************************/
  connection.query(
      'UPDATE conclusion SET place_conclusion=?, doctor= ?,comment =? , type_info = ?  WHERE id_conclusion = ?',
      [place_conclusion,doctor,comment, JSON.stringify(type_info), req.params.id],
      function (error, results, fields) {
        if (error) throw error;
       // res.redirect('/carta');
      }
  );
});


/*///////////////////////////*/
router.get('/carta/carta_file/:id', function(req, res, next) {
  console.log(req.session)
  if (!req.session.loggedin) {
    res.redirect('/');
    return;
  }
        connection.query(
            'SELECT conclusion.type_info as type_info,conclusion.comment as comment,conclusion.place_conclusion as place_conclusion,conclusion.doctor as doctor,conclusion.type_doctor as type_doctor,conclusion.data_conclusion as data_conclusion, conclusion.type_conclusion as type_conclusion, files.file_id as file_id, files.user_id as user_id,files.file_path as file_path,  files.file_type as file_type, conclusion.name_conclusion as name_conclusion FROM files left join conclusion on files.id_conclusion = conclusion.id_conclusion where files.file_id =?',
            [req.params.id],
            function (error, results, fields) {
              console.log(results)

              if (results.length === 0) {
                res.redirect('carta');
                return;
              }
              if(results[0].user_id!==req.session.user_id){
                res.redirect('carta');

              }
              console.log(results[0]['type_info'])
              res.render('carta_file' , {
                file: results[0],
                file_id: req.params.id,
                name_conclusion: results[0]['name_conclusion'],
                comment: results[0]['comment'],
                place_conclusion: results[0]['place_conclusion'],
                doctor: results[0]['doctor'],
                type_doctor: results[0]['type_doctor'],
                data_conclusion: results[0]['data_conclusion'],
                type_conclusion: results[0]['type_conclusion'],
                type_info: JSON.parse(results[0]['type_info'])
              });

            });
});


router.post('/carta/carta_file/:id', function(req, res, next) {
  // If the user is not logged in, redirect to the home page
  console.log(req.session)
  console.log(req.body)
  if (!req.session.loggedin) {
    res.redirect('/');
    return;
  }
  if (!req.body.type_doctor) {
    req.body.type_doctor = null;
  }
  if (!req.body.name_conclusion) {
    req.body.name_conclusion = null;
  }
  if (!req.body.place_conclusion) {
    req.body.place_conclusion = null;
  }
  if (!req.body.data_conclusion) {
    req.body.data_conclusion = null;
  }
  if (!req.body.doctor) {
    req.body.doctor = null;
  }
  if (!req.body.comment) {
    req.body.comment = null;
  }
    connection.query(
        'UPDATE conclusion SET comment=?, doctor=?, data_conclusion=?, place_conclusion=?,type_doctor=? ,name_conclusion = ? WHERE id_conclusion = (SELECT id_conclusion FROM files WHERE file_id = ?)',
        [req.body.comment,req.body.doctor,req.body.data_conclusion,req.body.place_conclusion,req.body.type_doctor,req.body.name_conclusion, req.params.id],
        function (error, results, fields) {
          if (error) throw error;
          res.redirect('/carta/carta_file/' + req.params.id);
        }
    );
});

module.exports = router;


