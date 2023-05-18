var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const session = require("express-session");
const multer = require('multer');

const date = require('date-and-time')


router.use(multer({dest: "public/file/upload"}).single("filedata"));

function formatDate(date) {
    if (!date) {
        return undefined;
    }
    var dd = date.getDate();
    if (dd < 10) dd = '0' + dd;

    var mm = date.getMonth() + 1;
    if (mm < 10) mm = '0' + mm;

    var yy = '20'
    yy += date.getFullYear() % 100;
    if (date.getFullYear() % 100 < 10) yy = '200' + date.getFullYear() % 100;

    return yy + '-' + mm + '-' + dd;
}

function close_session(res, req) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Destroy Session
    req.session.destroy((error) => {
        if (error) {
            console.log(error);
        } else {
            // Redirect the user to the home page
            res.redirect('/');
        }
    });
}

function type_inf(req) {
    console.log(req.body)
    let type_info = {};
    if (req.body.code !== undefined) {
        type_info['code'] = req.body.code
    }
    ;
    if (req.body.diagnosis !== undefined) {
        type_info['diagnosis'] = req.body.diagnosis
    }
    ;
    if (req.body.complaints !== undefined) {
        type_info['complaints'] = req.body.complaints
    }
    ;
    if (req.body.diagnosis !== undefined) {
        type_info['diagnosis'] = req.body.diagnosis
    }
    ;
    if (req.body.anamnez !== undefined) {
        type_info['anamnez'] = req.body.anamnez
    }
    ;
    if (req.body.conclusion !== undefined) {
        type_info['conclusion'] = req.body.conclusion
    }
    ;
    if (req.body.prescription !== undefined) {
        type_info['prescription'] = req.body.prescription
    }
    ;
    /**********************************************/
    if (req.body.area !== undefined) {
        type_info['area'] = req.body.area
    }
    ;
    /*******************************************/
    if (req.body.purpose !== undefined) {
        type_info['purpose'] = req.body.purpose
    }
    ;
    if (req.body.todoctor !== undefined) {
        type_info['todoctor'] = req.body.todoctor
    }
    ;
    if (req.body.justification !== undefined) {
        type_info['justification'] = req.body.justification
    }
    ;
    if (req.body.cameto !== undefined) {
        type_info['cameto'] = req.body.cameto
    }
    ;
    /**********************************************/
    if (req.body.number !== undefined) {
        type_info['number'] = req.body.number
    }
    ;
    if (req.body.date_starting !== undefined) {
        type_info['date_starting'] = req.body.date_starting
    }
    ;
    if (req.body.date_finish !== undefined) {
        type_info['date_finish'] = req.body.date_finish
    }
    ;
    /**************************************************/
    if (req.body.allergen !== undefined) {
        type_info['allergen'] = req.body.allergen
    }
    ;
    if (req.body.reaction !== undefined) {
        type_info['reaction'] = req.body.reaction
    }
    ;
    /*********************************************/
    if (req.body.medication !== undefined) {
        type_info['medication'] = req.body.medication
    }
    ;
    if (req.body.dose !== undefined) {
        type_info['dose'] = req.body.dose
    }
    ;
    return type_info;
};

/*
* filter_by - ключ по которому нужен фильтр
* filter_value - значение для фильтра
* filter_end - если он есть то он будет концом диапазона, а filter_value будет началом
* */
function filter(filter_by, filter_value, filter_end, results) {
    if (filter_by === undefined || filter_value === undefined) {
        return results
    }
    let result = []
    if (filter_end !== undefined) {
        for (let i = 0; i < results.length; i++) {
            if (results[i][filter_by] === null) {
                continue;
            }
            if (new Date(results[i][filter_by]) > (new Date(filter_value)) && (new Date(results[i][filter_by])) < (new Date(filter_end))) {
                result.push(results[i])
            }
        }
        return result
    }

    for (let i = 0; i < results.length; i++) {
        if (results[i][filter_by] === undefined) {
            continue;
        }
        if (results[i][filter_by] === filter_value) {
            result.push(results[i])
        }
    }
    return result
}

// sorted_by - ключ для сортировки, по которому будет по порядка
function sort(sorted_by, revers, results) {
    if (sorted_by === undefined) {
        return results;
    }

    function compare(a, b) {
        if (a[sorted_by] === undefined) {
            return 1;
        }
        if (b[sorted_by] === undefined) {
            return -1;
        }

        if (sorted_by === 'data_conclusion') {
            a = new Date(a[sorted_by]);
            b = new Date(b[sorted_by]);
        } else {
            a = a[sorted_by];
            b = b[sorted_by];
        }

        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }

    function compare_reverse(a, b) {
        if (a[sorted_by] === undefined) {
            return -1;
        }
        if (b[sorted_by] === undefined) {
            return 2;
        }

        if (sorted_by === 'data_conclusion') {
            a = new Date(a[sorted_by]);
            b = new Date(b[sorted_by]);
        } else {
            a = a[sorted_by];
            b = b[sorted_by];
        }

        if (a < b) {
            return 1;
        }
        if (a > b) {
            return -1;
        }
        return 0;
    }

    if (revers !== undefined) {
        results.sort(compare_reverse);
        return results;
    } else {
        results.sort(compare);
        return results;
    }
}

function search(search_value, results) {
    if (!search_value) {
        return results;
    }
    let searchResults = [];

    // проходим по каждому элементу в переданном массиве результатов
    results.forEach(result => {
        // проверяем, есть ли переданное значение поиска в имени заключения
        if (result.name_conclusion.toLowerCase().includes(search_value.toLowerCase())) {
            // если значение найдено, добавляем результат в массив searchResults
            searchResults.push(result);
        }
    });

    // сортируем полученный массив результатов по имени заключения в алфавитном порядке
    searchResults.sort((a, b) => a.name_conclusion.localeCompare(b.name_conclusion));

    // возвращаем отсортированный массив результатов поиска
    return searchResults;
}

//подключение бд
const connection = mysql.createConnection({
    host: 'localhost', user: 'user', password: 'password', database: 'mysite'
});
//проверка на подключение к бд
connection.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySQL server.');
})

router.use(session({
    secret: 'secret', resave: false, saveUninitialized: false
}))

/*///////////////////////////*/

/* GET home page. */
router.get('/', function (req, res, next) {

    res.render('index', {title: 'Express'});
});

const {NULL, NEWDATE} = require("mysql/lib/protocol/constants/types");

router.get('/home', function (req, res, next) {
    // If the user is loggedin
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    connection.query('SELECT * FROM visit where user_id =?', [req.session.user_id], function (error, results, fields) {
        console.log(results)
        if (results.length === 0) {
            res.render('home', {
                files: []
            });
            console.log(req.body)
            console.log(results)
        } else {
            console.log(req.body)
            console.log(results)
            // Pass the files array to the template
            res.render('home', {
                files: results
            });
        }
    });
});

router.get('/register', function (req, res, next) {
    res.render('register');
});
router.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    // Ensure the input fields exist and are not empty
    if (username && password) {
        // Execute SQL query that'll check if the username already exists
        connection.query('SELECT * FROM auth_users WHERE username = ?', [username], function (error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;

            // If the query returns any results, it means the username is already taken
            if (results.length > 0) {
                res.status(401).send({message: "Пользователем с таким логином уже существует."});
            } else {
                // If the username is available, execute SQL query to insert the new user into the database
                connection.query('INSERT INTO auth_users (username, password) VALUES (?, ?)', [username, password], function (error, results, fields) {
                    // If there is an issue with the query, output the error
                    if (error) throw error;
                    // If the user is successfully registered, redirect to the login page
                    connection.query('SELECT id FROM auth_users WHERE username = ?', [username], function (error, results, fields) {
                        connection.query('INSERT INTO info_users (id) VALUES (?)', [results[0]['id']], function (error, results, fields) {
                            if (error) throw error;
                        });
                        connection.query('INSERT INTO info_user_med (id) VALUES (?)', [results[0]['id']], function (error, results, fields) {
                            if (error) throw error;
                        });
                    });
                    res.status(200).send({message: "Регистрация прошла успешно. Войдите в аккаунт"});
                });
            }
        });
    } else {
        // If either the username or password is missing, send the client back to the registration page
        res.status(401).send({message: "Неверный логин или пароль. Повторите попытку"});
    }
});

router.get('/login', function (req, res, next) {

    res.render('login');
});
router.post('/login', (req, res) => {
    // Capture the input fields
    let username = req.body.username;
    let password = req.body.password;
    // Ensure the input fields exist and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        connection.query('SELECT id FROM auth_users WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            console.log(results);
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.user_id = results[0]['id'];
                res.redirect('/home');
            } else {
                // If the login fails, send an error message to the client
                res.status(401).send({message: "Неверный логин или пароль. Повторите попытку"});
            }
        });
    } else {
        // If either the username or password is missing, send the client back to the login page
        res.redirect('/home');
    }
});
router.get('/logout', (req, res) => {
    // Set cache control headers to prevent browser caching
    close_session(res, req);
});

router.get('/profile', function (req, res, next) {
    console.log(req.session)
    // If the user is loggedin
    if (req.session.loggedin) {
        connection.query('SELECT * FROM info_users join info_user_med WHERE info_users.id = ? and info_user_med.id=?', [req.session.user_id, req.session.user_id], function (error, results, fields) {
            if (error) throw error;

            res.render('profile', {
                name: results[0]['name'],
                surname: results[0]['surname'],
                gender: results[0]['gender'],
                birthday: formatDate(results[0]['birthday']),
                number_phone: results[0]['number_phone'],
                user_id: [req.session.user_id],
                number_polis: results[0]['number_polis'],
                chronic_diseases: results[0]['chronic_diseases'],
                type_blood: results[0]['type_blood'],
                allergy: results[0]['allergy'],
                insurance_company: results[0]['insurance_company']
            });
        });
    } else {
        // Not logged in
        res.redirect('/home');
    }
});

router.post('/profile', function (req, res, next) {
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    var name = req.body.name;
    var surname = req.body.surname;
    var gender = req.body.gender;
    var birthday = req.body.birthday;
    var number_phone = req.body.number_phone;
    var user_id = req.session.user_id;
    var number_polis = req.body.number_polis;
    var chronic_diseases = req.body.chronic_diseases;
    var type_blood = req.body.type_blood;
    var allergy = req.body.allergy;
    var insurance_company = req.body.insurance_company;
    console.log(req.body)
    if (!number_phone) {
        number_phone = null;
    } else {
        const phoneRegex = /^[0-9]{11}$/;
        if (!phoneRegex.test(number_phone)) {
            // Invalid phone number, send an alert message and redirect back to profile page
            res.send('{"error":"Номер телефона введен некорректно"}')
            return;
        }
    }
    if (!name) {
        name = null;
    }
    if (!surname) {
        surname = null;
    }
    if (!gender) {
        gender = null;
    }
    if (!birthday) {
        birthday = null;
    }
    if (!number_polis) {
        number_polis = null;
    }
    if (!chronic_diseases) {
        chronic_diseases = null;
    }
    if (!type_blood) {
        type_blood = null;
    }
    if (!allergy) {
        allergy = null;
    }
    if (!insurance_company) {
        insurance_company = null;
    }
    console.log(req.body)
    /****/
    connection.query('UPDATE info_users SET name=?, surname= ?,gender =? , birthday = ? , number_phone=? WHERE id = ?', [name, surname, gender, birthday, number_phone, user_id], function (error, results, fields) {
        if (error) {
            console.error(error);
            res.status(500).send('Error updating profile');
        } else {
            connection.query('UPDATE info_user_med SET number_polis=?, chronic_diseases= ?,type_blood =? , allergy = ? , insurance_company=? WHERE id = ?', [number_polis, chronic_diseases, type_blood, allergy, insurance_company, user_id], function (error, results, fields) {
                if (error) {
                    console.log(req.body)
                    console.error(error);
                    res.status(500).send('Error updating profile');
                } else {
                    res.redirect('/profile');
                }
            });
        }
    });
});

router.post('/delete_profile', (req, res) => {
    // Capture the input fields
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    let user_id = req.body.user_id;
    console.log(req.body)
    connection.query('DELETE FROM auth_users WHERE id = ?', [user_id], function (error, results, fields) {
        if (error) throw error;
        close_session(res, req);

    });
});

const pdfThumbnail = require('pdf-thumbnail');
const {query} = require("express");
const {log} = require("debug");
router.get('/carta', function (req, res, next) {
    console.log(req.session)

    // If the user is loggedin
    if (req.session.loggedin) {
        let folder = null;
        if (req.query.folder) {
            connection.query('SELECT * from folder where id_folder = ?', [req.query.folder], function (error, results, fields) {
                if (results) {
                    folder = results[0];
                }
            });
        }
        // Query the database for all files uploaded by the user
        connection.query('SELECT files.file_path as file_path, conclusion.folder as folder,conclusion.comment as comment,conclusion.folder as folder, conclusion.type_doctor as type_doctor,conclusion.type_info as type_info, files.file_id as file_id, files.file_type as file_type, conclusion.name_conclusion as name_conclusion, conclusion.type_conclusion as type_conclusion, conclusion.data_conclusion as data_conclusion, conclusion.id_conclusion as id_conclusion FROM files left join conclusion on files.id_conclusion = conclusion.id_conclusion where files.user_id =?', [req.session.user_id], function (error, results, fields) {
            results.forEach(element => {
                if (element['data_conclusion'] !== undefined && element['data_conclusion'] != null) {
                    element['data_conclusion'] = formatDate(element['data_conclusion'])
                }
            });

            console.log(error)
            console.log(results)
            if (results.length === 0) {
                console.log(req)
                res.render('carta', {
                    files: results,
                    needaddform: req.query.needaddform,
                    visit_id: req.query.visit_id,
                    data_visit: req.query.data_visit,
                    folder: folder
                });
                return;
            }
            let not_filter_files = results;
            results = filter(req.query.filter_by, req.query.filter_value, req.query.filter_end, results);
            let folder_temp = undefined;
            if(req.query.folder){
                folder_temp = parseInt(req.query.folder,10);
            }
            results = filter('folder', folder_temp, undefined, results)
            results = sort(req.query.sorted_by, req.query.revers, results)
            results = search(req.query.search_by, results)
            results.forEach(result => {
                if (result.file_type === 'pdf') {
                    result.file_path = result.file_path.slice(12)
                }
                result.type_info = JSON.parse(result.type_info)
            })
            // Pass the files array to the template
            res.render('carta', {
                files: results,
                needaddform: req.query.needaddform,
                visit_id: req.query.visit_id,
                data_visit: req.query.data_visit,
                folder: folder,
                not_filter_files : not_filter_files
            });
        });
    } else {
        // Not logged in
        res.redirect('/');
    }
});
router.post('/delete_record', (req, res) => {
    // Capture the input fields
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    let id_conclusion = req.body.id_conclusion;
    console.log(id_conclusion)
    connection.query('DELETE FROM conclusion WHERE id_conclusion = ?', [id_conclusion], function (error, results, fields) {
        if (error) throw error;
        res.sendStatus(200);
    });
});


router.post('/file/upload', function (req, res, next) {
    // If the user is not logged in, redirect to the home page
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    let name_conclusion = req.body.name_conclusion;
    let type_conclusion = req.body.type_conclusion;
    let data_conclusion = req.body.data_conclusion;
    let visit_id = req.body.visit_id;
    let type_doctor = req.body.type_doctor;
    let id_folder = req.body.id_folder;
    let filedata = req.file;
    if (!type_conclusion) {
        type_conclusion = null;
    }
    if (!visit_id) {
        visit_id = null;
    }
    if (!data_conclusion) {
        data_conclusion = null;
    }
    console.log(filedata);
    if (!filedata) {
        res.send("Ошибка при загрузке файла");
    }
    //убирам лишний паблик
    let path = req.file.path.replace('public\\', '');
    //берем тип
    let fileType = req.file.originalname.split('.').pop();
    connection.query('INSERT INTO conclusion (type_doctor,name_conclusion, type_conclusion,data_conclusion,user_id, folder) VALUES (?,?,?,?,?,?)', [type_doctor, name_conclusion, type_conclusion, data_conclusion, req.session.user_id, id_folder], function (error, results, fields) {
        if (error) throw error;
        connection.query('SELECT id_conclusion FROM conclusion WHERE name_conclusion = ?', [name_conclusion], function (error, results, fields) {
            let id_conclusion = results[0]['id_conclusion'];
            connection.query('INSERT INTO files (user_id, file_path,id_conclusion,file_type) VALUES (?, ?,?,?)', [req.session.user_id, path, [results[0]['id_conclusion']], fileType], function (error, results, fields) {
                if (error) throw error;
                console.log(req);
                if (visit_id) {
                    connection.query('UPDATE visit SET id_conclusion=? WHERE visit_id=?', [id_conclusion, visit_id], function (error, results, fields) {
                        if (error) throw error;
                    });
                }
                res.redirect('/file/upload/notedata/' + id_conclusion)
            });
        });
    });
});

router.get('/file/upload/notedata/:id', function (req, res, next) {
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    connection.query('SELECT * FROM conclusion where id_conclusion =?', [req.params.id], function (error, results, fields) {
        console.log(results)
        if (results.length === 0) {
            res.redirect('carta');
            return;
        }
        if (results[0].user_id !== req.session.user_id) {
            res.redirect('carta');

        }
        res.render('notedata', {
            id_conclusion: req.params.id,
            name_conclusion: results[0]['name_conclusion'],
            type_conclusion: results[0]['type_conclusion'],
            doctor: results[0]['doctor'],
            place_conclusion: results[0]['place_conclusion'],
            comment: results[0]['comment'],
        });
    });
});
router.post('/file/upload/notedata/:id', function (req, res, next) {
    // If the user is not logged in, redirect to the home page
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    let name_conclusion = req.body.name_conclusion;
    let comment = req.body.comment;
    let place_conclusion = req.body.place_conclusion;
    let doctor = req.body.doctor;
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
    console.log("code: ", req.body.code)
    console.log("complaints: ", req.body.complaints)
    let type_info = type_inf(req);
    /*********************************************/
    connection.query('UPDATE conclusion SET place_conclusion=?, doctor= ?,comment =? , type_info = ?  WHERE id_conclusion = ?', [place_conclusion, doctor, comment, JSON.stringify(type_info), req.params.id], function (error, results, fields) {
        if (error) throw error;
        res.redirect('/carta');
    });
});

/*///////////////////////////*/
router.get('/carta/carta_file/:id', function (req, res, next) {
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    connection.query('SELECT conclusion.type_info as type_info,conclusion.comment as comment,conclusion.place_conclusion as place_conclusion,conclusion.doctor as doctor,conclusion.type_doctor as type_doctor,conclusion.data_conclusion as data_conclusion, conclusion.type_conclusion as type_conclusion, files.file_id as file_id, files.user_id as user_id,files.file_path as file_path,  files.file_type as file_type, conclusion.name_conclusion as name_conclusion FROM files left join conclusion on files.id_conclusion = conclusion.id_conclusion where files.id_conclusion =?', [req.params.id], function (error, results, fields) {
        console.log(results)

        if (results.length === 0) {
            res.redirect('/carta');
            return;
        }
        if (results[0].user_id !== req.session.user_id) {
            res.redirect('/carta');

        }
        console.log(results[0]['type_info'])
        if (results[0].file_type === 'pdf') {
            results[0].file_path = results[0].file_path.slice(12)
        }
        res.render('carta_file', {
            file_type: results[0],
            file: results[0],
            file_id: req.params.id,
            name_conclusion: results[0]['name_conclusion'],
            comment: results[0]['comment'],
            place_conclusion: results[0]['place_conclusion'],
            doctor: results[0]['doctor'],
            type_doctor: results[0]['type_doctor'],
            data_conclusion: formatDate(results[0]['data_conclusion']),
            type_conclusion: results[0]['type_conclusion'],
            type_info: JSON.parse(results[0]['type_info']),
            id_conclusion: req.params.id
        });

    });
});
router.post('/carta/carta_file/:id', function (req, res, next) {
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
    let type_info = type_inf(req);
    connection.query('UPDATE conclusion SET type_info=?, comment=?, doctor=?, data_conclusion=?, place_conclusion=?,type_doctor=? ,name_conclusion = ? WHERE id_conclusion = ?', [JSON.stringify(type_info), req.body.comment, req.body.doctor, req.body.data_conclusion, req.body.place_conclusion, req.body.type_doctor, req.body.name_conclusion, req.params.id], function (error, results, fields) {
        if (error) throw error;
        res.redirect('/carta/carta_file/' + req.params.id);
    });
});


router.get('/visit_doctor', function (req, res, next) {
    console.log(req.session)
    let folders;
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    connection.query('SELECT * FROM folder where user_id =?', [req.session.user_id], function (error, results, fields) {
        console.log(results)
        if (results.length === 0) {
            folders = []
            console.log(results)

        } else {
            folders = results
            console.log(results)

        }
    });
    connection.query('SELECT * FROM visit where user_id =?', [req.session.user_id], function (error, results, fields) {
        console.log(results)
        if (results.length === 0) {
            res.render('visit_doctor', {
                visiters: [], folders: folders
            });
        } else {
            console.log(req.body)
            // Pass the files array to the template
            res.render('visit_doctor', {
                visiters: results, folders: folders
            });
        }
    });
});

router.post('/visit_doctor', function (req, res, next) {
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    if (!req.body.description) {
        req.body.description = null;
    }
    if (!req.body.data_visit) {
        req.body.data_visit = null;
    }
    if (!req.body.name_visit) {
        req.body.name_visit = null;
    }
    if (!req.body.data_visit) {
        req.body.data_visit = null;
    }
    if (!req.body.type_doctor) {
        req.body.type_doctor = null;
    }
    if (!req.body.name_doctor) {
        req.body.name_doctor = null;
    }
    if (!req.body.place) {
        req.body.place = null;
    }
    if (!req.body.id_conclusion) {
        req.body.id_conclusion = null;
    }
    console.log(req.body)
    if (req.body.visit_id) {
        connection.query('UPDATE visit SET name_visit=?, data_visit=?, type_doctor=?, name_doctor=?, place=?,type_doctor=? ,id_conclusion = ? WHERE visit_id = ?', [req.body.name_visit, req.body.data_visit, req.body.type_doctor, req.body.name_doctor, req.body.place, req.body.type_doctor, req.body.id_conclusion, req.body.visit_id], function (error, results, fields) {
            if (error) throw error;
            res.redirect('/visit_doctor');
        });
    } else {
        connection.query('INSERT INTO visit (user_id, name_visit,data_visit,type_doctor,name_doctor,place,id_conclusion) VALUES (?, ?,?,?, ?,?,?)', [req.session.user_id, req.body.name_visit, req.body.data_visit, req.body.type_doctor, req.body.name_doctor, req.body.place, req.body.type_doctor, req.body.id_conclusion], function (error, results, fields) {
            if (error) throw error;
            res.redirect('/visit_doctor')
        });
    }
});

router.post('/addfolder', function (req, res, next) {
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    if (!req.body.description) {
        req.body.description = null;
    }
    console.log(req.body)

    connection.query('INSERT INTO folder (user_id,name_folder,description) VALUES (?, ?,?)', [req.session.user_id, req.body.name_folder, req.body.description], function (error, results, fields) {
        if (error) throw error;
        connection.query('SELECT * from folder where name_folder = ? AND user_id = ?', [req.body.name_folder, req.session.user_id], function (error, results, fields) {
            if (error) throw error;
            res.redirect('/carta?folder=' + results[0]['id_folder'])
        });
    });


});

router.post('/addconclinfolder', function (req, res, next) {
    console.log(req.session)
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }
    console.log(req.body);
    if (req.body.selectedFiles){
        var quere = 'UPDATE conclusion SET folder = ? WHERE id_conclusion IN (?) AND user_id = ?';
        connection.query(quere, [req.body.id_folder, req.body.selectedFiles,req.session.user_id], function(error, results, fields) {
            if (error) throw error;
            res.redirect('/carta?folder=' + req.body.id_folder)
        });
    }
});
module.exports = router;


