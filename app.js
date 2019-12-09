const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer')
const session = require('express-session');

const app = express();
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
const connection = mysql.createConnection({
    host: '183.101.196.138',
    user: 'kdkd',
    password: 'kdkd',
    database: 'kdkd'
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        throw err;
    }
    console.log('connerct success : ' + connection.threadId);
});
//-----------DB------------------

// 추후 수정
// 로그인 되어있으면 -> home
// 로그인 안돼있으면 -> login
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/home', (req, res) =>{
    res.render('home')
});

app.get('/login', (req, res) =>{
    res.render('login')
});

app.get('/notice', (req, res) =>{
    res.render('notice')
});

app.get('/board', (req, res) =>{
    res.render('board')
});

app.get('/calendar', (req, res) =>{
    res.render('calendar')
});

app.get('/inout', (req, res) =>{
    res.render('inout')
});

app.get('/admin', (req, res) =>{
    res.render('admin')
});

app.listen(8888, () => {
	console.log('8888 port opened!!!');
});