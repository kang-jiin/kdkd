//////////////////////////////////////////////////////////////
//                      사용자 기능                          //
//////////////////////////////////////////////////////////////

const mysql = require('mysql');
const pool = mysql.createPool({
    host: '183.101.196.138',
    user: 'kdkd',
    password: 'kdkd',
    database: 'kdkd',
    port: 3306,
    connectionLimit: 20,
    waitForConnection: false
});

var sign_up_err = 0;

const router = require('express').Router();

router.get('/login', (req, res) => {
    const sess = req.session;
    res.render('user/login', { pass: true });
});

router.post('/login', (req, res) => {
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

router.get('/signup', (req, res) => {
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

router.post('/signup', (req, res) => {
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

router.get('/pw', (req, res) => {
    res.render('user/pw', { msg: "정확하게 입력하세요" });
});

router.post('/pw', (req, res) => {
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

router.get('/mypage', (req, res) => {
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

router.post('/mypage', (req, res) => {
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

router.get('/user_student_add', (req, res) => {
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

router.post('/user_student_add', (req, res) => {
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

router.get('/logout', (req, res) => {
    const sess = req.session;
    sess.destroy();
    res.redirect('/login');
});

module.exports = router;