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
    // req.session.userid = '1';
    // req.session.name = '1';
    // req.session.grade = 'G';
    res.locals.user = req.session;
    res.locals.menu = req.url.split('/')[1];
    if(!req.session.userid && res.locals.menu != 'login') {
        return res.redirect('/login');
    }
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
    res.redirect('/home');
});

app.get('/login', (req, res) => {
    const sess = req.session;
    res.render('user/login', { pass: true });
});

app.post('/login', (req, res) => {
    const sess = req.session;
    let userid = req.body.username;
    let pass = req.body.password;
    let values = [userid, pass];
    let login_query = `
    select *
    from user
    where id=? and password=?;
    `;
    let inout_query = `
    select s.id as id, s.name as name, io.in_out_flag, t.time
    from 
    relation r inner join student s on r.student_id = s.id
    left outer join (select student_id, max(time) as time
    from in_out
    where date_format(time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    group by student_id
    ) t
    on s.id = t.student_id
    left outer join in_out io on io.time = t.time
    where r.parents_id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(login_query, values, (err, login_results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (login_results.length == 1) {
                connection.query(inout_query, userid, (err, inout_results) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    var msg = "";
                    inout_results.forEach(function(inout_result){
                        msg += inout_result.name;
                        if(inout_result.in_out_flag == "in") msg += " 등원";
                        else if(inout_result.in_out_flag == "out") msg += " 하원";
                        else msg += " 미등원";
                    });
                    sess.userid = login_results[0].id;
                    sess.name = login_results[0].name;
                    sess.grade = login_results[0].grade;
                    sess.msg = msg;
                    req.session.save(() => {
                        connection.release();
                        res.redirect('/home');
                    });
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

//////////////////////////////////////////////////////////////
//                      HOME                                //
//////////////////////////////////////////////////////////////

app.get('/home', (req, res) => {
    let select_environment = `
    select * from environment
    order by time desc
    `;
    let select_board = `
    select b.id as id, u.name as name, b.title as title, b.content as content, 
    case
    when date_format(b.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(b.time, '%H:%i:%s')
    else date_format(b.time, '%Y-%m-%d')
    end as time, b.hit as hit
    from board b, user u
    where b.writer_id = u.id
    order by b.time desc
    limit 0, 5
    `;
    pool.getConnection((err, connection) => {
        connection.query(select_environment, (err, environment_results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_board, (err, board_results) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.release();
                res.render('home', { environment: environment_results[0], boards: board_results });
            });
        });
    });
});

//////////////////////////////////////////////////////////////
//                      알림장                              //
//////////////////////////////////////////////////////////////

app.get('/notice', (req, res) => {
    let classname;
    if(req.query.class != undefined) {
        classname = req.query.class;
    }
    else {
        classname = "햇님반";
    }

    let select_notice = `
    select n.id as id, u.id as writer_id, u.name as name, n.title as title, n.content as content, 
    case
    when date_format(n.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(n.time, '%H:%i:%s')
    else date_format(n.time, '%Y-%m-%d')
    end as time
    from notice n, user u
    where n.writer_id = u.id
    and n.class = ?
    order by n.time desc
    `;
    pool.getConnection((err, connection) => {
        connection.query(select_notice, [classname], (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.render('notice/notice', { classname: classname, articles: results });
        });
    });
});

app.get('/notice/write', (req, res) => {
    res.render('notice/write');
});

app.get('/notice/write_content', (req, res) => {
    res.render('notice/write_content');
});

app.post('/notice/write', (req, res) => {
    let writer_id = req.session.userid;
    let classname = req.body.classname;
    let title = req.body.title;
    let content = req.body.content;

    let values = [writer_id, classname, title, content];
    let notice_insert = `
        insert into notice (writer_id, class, title, content, time)
        values (?, ?, ?, ?, now())
    `;

    pool.getConnection((err, connection) => {
        connection.query(notice_insert, values, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.release();
            res.redirect('/notice');
        });
    });
});

app.get('/notice/modify', (req, res) => {
    let num = req.query.num;

    let board_select = `
        select * 
        from notice
        where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(board_select, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            res.render('notice/modify', { article: result[0] });
        });
    });
});

app.get('/notice/modify_content', (req, res) => {
    res.render('notice/modify_content');
});

app.post('/notice/modify', (req, res) => {
    let id = req.body.id;
    let title = req.body.title;
    let content = req.body.content;
    let classname = req.body.classname;

    let values = [title, content, classname, id];
    let notice_update = `
    update notice
    set title=?, content=?, class=?
    where id=?
    `;
    pool.getConnection((err, connection) => {
        connection.query(notice_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/notice');
        });
    });
});

app.get('/notice/delete', (req, res) => {
    let num = req.query.num;

    let notice_delete = `
    delete from notice 
    where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(notice_delete, num, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/notice');
        });
    });
});


//////////////////////////////////////////////////////////////
//                      게시판                              //
//////////////////////////////////////////////////////////////

app.get('/board', (req, res) => {
    let page = req.query.page;
    if(req.query.page != undefined) page = req.query.page;
    else page= 1;
    
    let select_board = `
    select b.id as id, u.name as name, b.title as title, b.content as content, 
    case
    when date_format(b.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(b.time, '%H:%i:%s')
    else date_format(b.time, '%Y-%m-%d')
    end as time, b.hit as hit
    from board b, user u
    where b.writer_id = u.id
    order by b.time desc
    LIMIT ?, ?
    `;

    let select_count =`
    select count(*) as num
    from board
    `;
    pool.getConnection((err, connection) => {
        connection.query(select_board,[(page * 10) - 10, 9], (err, c_results, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_count, (err, countes, fields) =>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.release();
                res.render('board/board', { articles: c_results, pages: Math.ceil(countes[0].num/10), current: page});    
            })
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
    let board_insert = `
        insert into board (writer_id, title, content, time, hit)
        values (?, ?, ?, now(), 0)
    `;

    pool.getConnection((err, connection) => {
        connection.query(board_insert, values, (err) => {
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
    union
    select concat(name, " 생일") as content, date_format(birth, '%m') as month, date_format(birth, '%d') as day 
    from student
    `;
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
    const sess = req.session;
    let id = sess.userid;

    let in_select = `
        select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no
        from relation, student, in_out
        where relation.student_id = student.id 
        and student.id = in_out.student_id 
        and in_out.in_out_flag = 'in' 
        and relation.parents_id = ?
        order by in_out.time desc
    `;
    let out_select = `
        select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no
        from relation, student, in_out
        where relation.student_id = student.id 
        and student.id = in_out.student_id 
        and in_out.in_out_flag = 'out' 
        and relation.parents_id = ?
        order by in_out.time desc
    `;
    pool.getConnection((err, connection) => {
        connection.query(in_select, id, (err, result1) =>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(out_select, id, (err, result2) =>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                res.render('inout/inout', { ins : result1, outs: result2});    
            });    
        });
    }); 
});

app.get('/admin', (req, res) => {
    let class_values = ["햇님반", "별님반", "달님반", "꽃님반"];
    let select_student = `
    select id, name, class, date_format(birth, '%Y-%m-%d') as birth, rfid_key
    from student 
    where class = ?`;

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