const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer')
const session = require('express-session');

const app = express();
const http = require('http').Server(app);
//var upload = multer({ dest: 'uploads/' });

var sign_up_err = 0;

app.locals.pretty = true;
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
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
    if (sess.userid) {
        res.render('home');
    }
    else {
        res.render('user/login');
    }
});

app.get('/login', (req, res) => {
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
                    res.redirect('/');
                });
            } else {
                connection.release();
                res.render('user/login', { pass: false });
            }
        })
    });
});

app.get('/signup', (req, res) => {
    let get_id = `
        select id
        from user
    `;
    let ids = new Array();
    pool.getConnection((err, connection) => {
        connection.query(get_id, (err, results, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            for (var i = 0; i < results.length; i++)
                ids.push(results[i].id);
            if (sign_up_err == 1)
                msg = "정보가 없습니다";
            else
                msg = "정확하게 입력해주세요";
            sign_up_err = 0;
            connection.release();
            res.render('user/signup', { ids: ids, msg: msg });
        });
    });
});

app.post('/signup', (req, res) => {
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
    name = ?
    `;
    let relation_insert = `
    insert into relation (student_id, parents_id)
    values(?, ?)
    `;
    pool.getConnection((err, connection) => {
        connection.query(user_insert, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_student, values_relation, (err, result) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                if (result.length > 0) {
                    let kim = [result[0].id, id];
                    connection.query(relation_insert, kim, (err, result) => {
                        connection.release();
                        res.redirect('/login');
                    });
                } else {
                    sign_up_err = 1;
                    connection.release();
                    res.redirect('/signup');
                }
            });
        });
    });
});

app.get('/pw', (req, res) => {
    res.render('user/pw', { msg: "정확하게 입력하세요" });
});

app.post('/pw', (req, res) => {
    const sess = req.session;

    let name = req.body.name;
    let emailid = req.body.emailid;
    let emaildomain = req.body.emaildomain;

    let values = [name, emailid, emaildomain];
    let find_idpw_query = `
    select *
    from user
    where name=? and emailid=? and emaildomain=?;
    `;
    pool.getConnection((err, connection) => {
        connection.query(find_idpw_query, values, (err, results) => {
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
                    res.redirect('/mypage');
                });
            } else {
                connection.release();
                res.render('user/pw', { msg: "등록된 계정이 없습니다." });
            }
        });
    });
});

app.get('/mypage', (req, res) => {
    let userid = req.session.userid;
    let user_data_query = `
        select *
        from user
        where id = ?
    `;
    let student_data_query = `
        select id, name, class, date_format(birth, '%Y-%m-%d') as birth
        from relation, student
        where relation.parents_id = ? and
        relation.student_id = student.id
    `
    pool.getConnection((err, connection) => {
        connection.query(user_data_query, [userid], (err, userresults, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(student_data_query, [userid], (err, studentresults, fields) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.release();
                res.render('user/mypage', { article: userresults[0], student: studentresults });
            });
        });
    });
});

app.post('/mypage', (req, res) => {
    const sess = req.session;

    let id = sess.userid;
    let name = req.body.name;
    let password = req.body.pass;
    let emailid = req.body.emailid;
    let emaildomain = req.body.emaildomain;
    let tel1 = req.body.tel1;
    let tel2 = req.body.tel2;
    let tel3 = req.body.tel3;
    let zip_code = req.body.addr1;
    let address = req.body.addr2;
    let detail_address = req.body.addr3;

    let values = [password, name, emailid, emaildomain, tel1, tel2, tel3, zip_code, address, detail_address, id];
    let users_update = `
    update user set
    password=?, name=?, emailid=?, emaildomain=?, 
    tel1=?, tel2=?, tel3=?, zip_code=?, address=?, detail_address=?
    where id=?
    `;
    pool.getConnection((err, connection) => {
        connection.query(users_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            sess.userid = id;
            sess.name = name;
            sess.grade = "G";
            req.session.save(() => {
                res.redirect('/');
            });
        });
    });
});

app.get('/user_student_add', (req, res) => {
    let get_id = `
        select id
        from user
    `;
    let ids = new Array();
    pool.getConnection((err, connection) => {
        connection.query(get_id, (err, results, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            for (var i = 0; i < results.length; i++)
                ids.push(results[i].id);
            if (sign_up_err == 1)
                msg = "정보가 없습니다";
            else
                msg = "정확하게 입력해주세요";
            sign_up_err = 0;
            connection.release();
            res.render('user/user_student_add', { ids: ids, msg: msg });
        });
    });
});

app.post('/user_student_add', (req, res) => {
    const sess = req.session;
    let id = sess.userid;
    let classname = req.body.classname;
    let name = req.body.name;
    let values = [classname, name];

    let select_student = `
    select * from student 
    where class = ? and
    name = ?
    `;
    let relation_insert = `
    insert into relation (student_id, parents_id)
    values(?, ?)
    `;

    pool.getConnection((err, connection) => {
        connection.query(select_student, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            if (result.length > 0) {
                let realation_values = [result[0].id, id];
                connection.query(relation_insert, realation_values, (err, result) => {
                    connection.release();
                    res.redirect('/home');
                });
            } else {
                sign_up_err = 1;
                connection.release();
                res.redirect('/user_student_add');
            }
        });
    });
});

app.get('/logout', (req, res) => {
    const sess = req.session;
    sess.destroy();
    res.redirect('/login');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/notice', (req, res) => {
    res.render('notice/notice');
});

//////////////////////////////////////////////////////////////
//                      게시판                              //
//////////////////////////////////////////////////////////////

app.get('/board', (req, res) => {
    let select_board = `
    select b.id as id, u.name as name, b.title as title, b.content as content, 
    case
    when date_format(b.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(b.time, '%H:%i:%s')
    else date_format(b.time, '%Y-%m-%d')
    end as time, b.hit as hit
    from board b, user u
    where b.writer_id = u.id
    `;
    pool.getConnection((err, connection) => {
        connection.query(select_board, (err, results, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.render('board/board', { articles: results });
        });
    });
});

app.get('/board/view', (req, res) => {
    let num = req.query.num;

    let hit_update = `
    update board
    set hit= hit+1
    where id=?
    `;
    let select_board = `
    select b.id as id, u.id as writer_id, u.name as name, b.title as title, b.content as content, 
    date_format(b.time, '%Y-%m-%d') as time, b.hit as hit
    from board b, user u
    where b.writer_id = u.id
    and b.id = ?
    `;
    let select_comments = `
    select c.id as id, u.name as writer, c.content as content, 
    case
    when date_format(c.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(c.time, '%H:%i:%s')
    else date_format(c.time, '%Y-%m-%d')
    end as time
    from comments c, user u
    where c.writer_id = u.id
    and board_id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(hit_update, [num], (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.query(select_board, num, (err, results) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.query(select_comments, num, (err, comment_lists) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    connection.release();
                    res.render('board/view', { article: results[0], comment_lists: comment_lists });
                });
            });
        });
    });
});

app.get('/board/write', (req, res) => {
    res.render('board/write');
});

app.get('/board/write_content', (req, res) => {
    res.render('board/write_content');
});

app.post('/board/write', (req, res) => {
    let writer_id = req.session.userid;
    let title = req.body.title;
    let content = req.body.content;

    let values = [writer_id, title, content];
    let item_insert = `
        insert into board (writer_id, title, content, time, hit)
        values (?, ?, ?, now(), 0)
    `;

    pool.getConnection((err, connection) => {
        connection.query(item_insert, values, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.release();
            res.redirect('/board');
        });
    });
});

app.get('/board/modify', (req, res) => {
    let num = req.query.num;

    let board_select = `
        select * 
        from board
        where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(board_select, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            res.render('board/modify', { article: result[0] });
        });
    });
});

app.get('/board/modify_content', (req, res) => {
    res.render('board/modify_content');
});

app.post('/board/modify', (req, res) => {
    let id = req.body.id;
    let title = req.body.title;
    let content = req.body.content;

    let values = [title, content, id];
    let board_update = `
    update board
    set title=?, content=?
    where id=?
    `;
    pool.getConnection((err, connection) => {
        connection.query(board_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/board/view?num=' + id);
        });
    });
});

app.get('/board/delete', (req, res) => {
    var num = req.query.num;
    let board_check = `
        select *
        from board
        where id = ?
    `;
    let comments_check = `
        select * from comments
        where board_id = ?
    `;
    let comments_delete = `
        delete from comments
        where board_id = ?
    `;
    let board_delete = `
        delete from board
        where id = ?
    `;
    pool.getConnection((err, connection) => {
        connection.query(board_check, [num], (err, check_result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            if (check_result.length > 0) {
                connection.query(comments_check, [num], (err, file_data) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error');
                    }
                    connection.beginTransaction((err) => {
                        if (err) {
                            throw err;
                        }
                        connection.query(comments_delete, [num], (err, results, fields) => {
                            if (err) {
                                console.log(err);
                                res.status(500).send('Internal Server Error!!!');
                            }
                            connection.query(board_delete, [num], (err, results, fields) => {
                                if (err) {
                                    console.log(err);
                                    res.status(500).send('Internal Server Error!!!');
                                }
                                connection.commit((err) => {
                                    if (err) {
                                        connection.rollback(() => {
                                            console.log(err);
                                            throw err;
                                        });
                                    }
                                    res.redirect('/board');
                                });
                            });
                        });
                    });
                });
            } else {
                connection.release();
                res.redirect('/board');
            }
        });
    });
});

app.post('/comment/add', (req, res) => {
    const sess = req.session;
    let num = req.query.num;
    let comment = req.body.comment;

    let values = [num, sess.userid, comment];
    let comments_insert = `
        insert into comments
        (board_id, writer_id, content, time)
        values (?, ?, ?, now())
    `;
    pool.getConnection((err, connection) => {
        connection.query(comments_insert, values, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }            
            res.redirect('/board/view?num=' + num);
            connection.release();
        });
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/calendar', (req, res) => {
    let select_birth =`
        select content, date_format(time, '%m') as month, date_format(time, '%d') as day 
        from calendar
    `
    pool.getConnection((err, connection) =>{
        connection.query(select_birth, (err, result)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            res.render('calendar/calendar', {results : result});
        });
    });
});


app.get('/inout', (req, res) => {
    res.render('inout/inout');
});

app.get('/admin', (req, res) => {
    let class_values = ["햇님반", "별님반", "달님반", "꽃님반"];
    let select_student = `
    select id, name, class, date_format(birth, '%Y-%m-%d') as birth, rfid_key
    from student 
    where class = ?`

    pool.getConnection((err, connection) => {
        connection.query(select_student, class_values[0], (err, result1) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_student, class_values[1], (err, result2) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.query(select_student, class_values[2], (err, result3) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    connection.query(select_student, class_values[3], (err, result4) => {
                        if (err) {
                            console.log(err);
                            connection.release();
                            res.status(500).send('Internal Server Error!!!')
                        }
                        connection.release();
                        res.render('admin/admin', { student1: result1, student2: result2, student3: result3, student4: result4 });
                    });
                });
            });
        });
    });

});

app.get('/admin/student_add', (req, res) => {
    res.render('admin/student_add');
});

app.post('/admin/student_add', (req, res) => {
    let classname = req.body.classname;
    let name = req.body.name;
    let birth = req.body.birth;
    let rfid = req.body.rfid;

    let values = [classname, name, birth, rfid];
    let student_insert = `
    insert into student (class, name, birth, rfid_key)
    values(?, ?, ?, ?)`;

    pool.getConnection((err, connection) => {
        connection.query(student_insert, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/admin');
        });
    });
});

app.get('/admin/student_modify/:num', (req, res) => {
    var num = req.params.num;
    let select_student = `
    select id, name, class, date_format(birth, '%Y-%m-%d') as birth, rfid_key
    from student 
    where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(select_student, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.render('admin/student_modify', { student: result[0] });
        });
    });
});

app.post('/admin/student_modify/:num', (req, res) => {
    var num = req.params.num;
    let classname = req.body.classname;
    let name = req.body.name;
    let birth = req.body.birth;
    let rfid = req.body.rfid;

    let values = [classname, name, birth, rfid, num];
    let student_update = `
    update student
    set class=?, name=?, birth=?, rfid_key=?
    where id=?
    `;
    pool.getConnection((err, connection) => {
        connection.query(student_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/admin');
        });
    });
});

app.get('/admin/student_delete/:num', (req, res) => {
    var num = req.params.num;
    let relation_check = `
    select * from relation
    where student_id = ?
    `;
    let student_delete = `
    delete from student 
    where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(relation_check, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            if (result.length > 0) {
                res.redirect('/admin');
            }
            else {
                connection.query(student_delete, num, (err) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    connection.release();
                    res.redirect('/admin');
                });
            }
        });
    });
});