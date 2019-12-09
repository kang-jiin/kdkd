const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer')
const session = require('express-session');

const app = express();
const http = require('http').Server(app);
//var upload = multer({ dest: 'uploads/' });

app.locals.pretty = true;
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    res.locals.user = req.session;
    next();
});

app.set('views', './views');
app.set('view engine', 'ejs');

//-----------DB------------------
const pool = mysql.createPool({
    host: '183.101.196.138',
    user: 'kdkd',
    password: 'kdkd',
    database: 'kdkd',
    port: 3306,
    connectionLimit: 20,
    waitForConnection: false
});
http.listen(8888, () => {
    console.log('8888 port opened!!!');
})
//-----------DB------------------

app.get('/', (req, res) => {
    const sess = req.session;
    if(sess.userid) {
        res.render('home');
    }
    else {
        res.render('login');
    }
});

app.get('/login', (req, res) =>{
    const sess = req.session;
    res.render('login', { pass: true });
});

app.post('/login', (req, res) => {
    const sess = req.session;
    let values = [req.body.username, req.body.password];
    let login_query = `
    select *
    from user
    where id=? and password=?;
    `;
    pool.getConnection((err, connection) => {
        connection.query(login_query, values, (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (results.length == 1) {
                sess.userid = results[0].id;
                sess.name = results[0].name;
                sess.grade = results[0].grade;
                req.session.save(() => {
                    connection.release();
                    console.log(results[0].id);
                    console.log(results[0].name);
                    res.redirect('/');
                });
            } else {
                connection.release();
                res.render('login', { pass: false });
            }
        })
    });
});

app.get('/mypage', (req, res) =>{
    res.render('mypage');
});

app.get('/logout', (req, res) =>{
    const sess = req.session;
    sess.destroy();
    res.redirect('/login');
});

app.get('/home', (req, res) =>{
    res.render('home');
});

app.get('/notice', (req, res) =>{
    res.render('notice');
});

app.get('/board', (req, res) =>{
    res.render('board');
});

app.get('/calendar', (req, res) =>{
    res.render('calendar');
});

app.get('/inout', (req, res) =>{
    res.render('inout');
});

app.get('/admin', (req, res) =>{
    res.render('admin');
});