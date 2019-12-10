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
        res.render('user/login');
    }
});

app.get('/login', (req, res) =>{
    const sess = req.session;
    res.render('user/login', { pass: true });
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
                res.render('user/login', { pass: false });
            }
        })
    });
});

app.get('/mypage', (req, res) =>{
    res.render('user/mypage');
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
    res.render('notice/notice');
});

app.get('/board', (req, res) =>{
    res.render('board/board');
});

app.get('/calendar', (req, res) =>{
    res.render('calendar/calendar');
});

app.get('/inout', (req, res) =>{
    res.render('inout/inout');
});

app.get('/admin', (req, res) =>{
    res.render('admin/admin');
});

app.get('/admin/student_add', (req, res) =>{
    res.render('admin/student_add');
});

app.get('/signup', (req, res) =>{
    res.render('user/signup');
});
app.post('/signup', (req, res)=>{
    let id = req.body.id;
    let name = req.body.name;
    let password = req.body.pass;
    let emailid = req.body.emailid;
    let emaildomain = req.body.emaildomain;
    let tel1 = req.body.tel1;
    let tel2 = req.body.tel2;
    let tel3 = req.body.tel3;
    let addr1 = req.body.addr1;
    let addr2 = req.body.addr2;
    let addr3 = req.body.addr3;
    let cln1 = req.body.cln1;
    let cln2 = req.body.cln2;

    let values = [id, password, "P", name, emailid, emaildomain, tel1, tel2, tel3, addr1, addr2, addr3];
    let values_relation = [cln1, cln2];
    let user_insert = `
    insert into user (id, password, grade, name, emailid, emaildomain, tel1, tel2, tel3, zip_code, address, detail_address)
    values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    let select_student = `
    select * from student 
    where class = ? and
    name = ?`
    let relation_insert = `
    insert into relation (student_id, parents_id)
    values(?, ?)`;
    pool.getConnection((err, connection) => {
        connection.query(user_insert, values, (err, result)=>{
            if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_student, values_relation, (err, result)=>{
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error!!!')
                }
                if(result.length > 0){
                    let kim = [result[0].id, id];
                    connection.query(relation_insert, kim, (err, result)=>{
                        res.redirect('/login');
                    });
                }    
            });        
        });
    });
});

app.get('/pw', (req, res) =>{
    res.render('user/pw');
});