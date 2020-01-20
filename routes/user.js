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
var passport = require('passport'); //passport 추가
var NaverStrategy = require('passport-naver').Strategy;
var KakaoStrategy = require('passport-kakao').Strategy;

const router = require('express').Router();

router.get('/login', (req, res) => {
    res.render('user/login', { pass: true });
});

router.post('/login', (req, res) => {
    const sess = req.session;
    let userid = req.body.username;
    let pass = req.body.password;
    let values = [userid, pass];
    let user_check = `
    select *
    from user
    where id=? and password=?;
    `;

    pool.getConnection((err, connection) => {
        connection.query(user_check, values, (err, login_results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (login_results.length == 1) {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                sess.userid = login_results[0].id;
                sess.name = login_results[0].name;
                sess.grade = login_results[0].grade;
                req.session.save(() => {
                    connection.release();
                    res.redirect('/home');
                });
            } else {
                connection.release();
                res.render('user/login', { pass: false });
            }
        })
    });
});

router.get('/naver', passport.authenticate('naver', null), function (req, res) {
    console.log("/main/naver");
});

//처리 후 callback 처리 부분 성공/실패 시 리다이렉트 설정
router.get('/naver/callback', passport.authenticate('naver', {
    successRedirect: '/user/naver/login',
    failureRedirect: '/user/login'
})
);

//'네아로'에 신청한 정보
passport.use(new NaverStrategy({
    clientID: '7QOxIDDluRGu3c65_Emz',
    clientSecret: 'mbicEgAL13',
    callbackURL: '/user/naver/callback'
},

    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            var user = {
                id: 'naver_' + profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                provider: 'naver',
                naver_id: profile.id
            };

            let user_select = `
                select id
                from user
                where naver_id = ?
            `;
            pool.getConnection((err, connection) => {
                connection.query(user_select, user.naver_id, (err, result) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    if (result.length == 0) {        
                        let emailid = user.email.split('@')[0];
                        let emaildomain = user.email.split('@')[1];
                        let values = [user.id, "N", user.name, emailid, emaildomain, user.naver_id];
                        let user_insert = `
                        insert into user (id, grade, name, emailid, emaildomain, naver_id)
                        values(?, ?, ?, ?, ?, ?)
                        `;
                        connection.query(user_insert, values, (err) => {
                            if (err) {
                                console.log(err);
                                connection.release();
                                res.status(500).send('Internal Server Error!!!')
                            }
                            connection.release();
                        });
                    }
                });
            });

            return done(null, user);
        });
    }
));

router.get('/naver/login', (req, res) => {
    const sess = req.session;
    let id = sess.userid;
    let relation_select = `
        select *
        from relation
        where parents_id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(relation_select, id, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            if (result.length == 0) {
                req.session.grade = 'N';
                res.redirect('/user/user_student_add');
            }
            else {
                req.session.grade = 'P';
                res.redirect('/home');
            }
        });
    });
});

router.get('/kakao', passport.authenticate('kakao', null), function (req, res) {
    console.log("/main/kakao");
});

//처리 후 callback 처리 부분 성공/실패 시 리다이렉트 설정
router.get('/kakao/callback', passport.authenticate('kakao', {
    successRedirect: '/user/kakao/login',
    failureRedirect: '/user/login'
})
);

passport.use(new KakaoStrategy({
    clientID: 'f951983d31e09d40c986abb400ae1e9c',
    callbackURL: '/user/kakao/callback'
},

    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            var user = {
                id: 'kakao_' + profile.id,
                name: profile.username,
                provider: 'kakao',
                kakao_id: profile.id
            };

            let user_select = `
                select id
                from user
                where kakao_id = ?
            `;
            pool.getConnection((err, connection) => {
                connection.query(user_select, user.kakao_id, (err, result) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    if (result.length == 0) {        
                        let values = [user.id, "N", user.name, user.kakao_id];
                        let user_insert = `
                        insert into user (id, grade, name, kakao_id)
                        values(?, ?, ?, ?)
                        `;
                        connection.query(user_insert, values, (err) => {
                            if (err) {
                                console.log(err);
                                connection.release();
                                res.status(500).send('Internal Server Error!!!')
                            }
                            connection.release();
                        });
                    }
                });
            });

            return done(null, user);
        });
    }
));

router.get('/kakao/login', (req, res) => {
    const sess = req.session;
    let id = sess.userid;
    let relation_select = `
        select *
        from relation
        where parents_id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(relation_select, id, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            if (result.length == 0) {
                req.session.grade = 'N';
                res.redirect('/user/user_student_add');
            }
            else {
                req.session.grade = 'P';
                res.redirect('/home');
            }
        });
    });
});

//failed to serialize user into session 에러 발생 시 아래의 내용을 추가 한다.
passport.serializeUser(function (user, done) {    
    done(null, user);
});

passport.deserializeUser(function (req, user, done) {
    // passport로 로그인 처리 후 해당 정보를 session에 담는다.
    req.session.userid = user.id;
    req.session.name = user.name;
    // console.log("Session Check :" + req.session.userid);
    done(null, user);
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
    let student_select = `
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
            connection.query(student_select, values_relation, (err, result) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                if (result.length > 0) {
                    let kim = [result[0].id, id];
                    connection.query(relation_insert, kim, (err, result) => {
                        connection.release();
                        res.redirect('/user/login');
                    });
                } else {
                    sign_up_err = 1;
                    connection.release();
                    res.redirect('/user/signup');
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
    let find_idpw_check = `
    select *
    from user
    where name=? and emailid=? and emaildomain=?;
    `;
    pool.getConnection((err, connection) => {
        connection.query(find_idpw_check, values, (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (results.length == 1) {
                sess.userid = results[0].id;
                sess.name = results[0].name;
                sess.grade = 'U';
                req.session.save(() => {
                    connection.release();
                    res.redirect('/user/mypage');
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
    let user_check= `
        select *
        from user
        where id = ?
    `;
    let student_check = `
        select id, name, class, date_format(birth, '%Y-%m-%d') as birth
        from relation, student
        where relation.parents_id = ? and
        relation.student_id = student.id
    `
    pool.getConnection((err, connection) => {
        connection.query(user_check, [userid], (err, userresults, fields) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(student_check, [userid], (err, studentresults, fields) => {
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
    let user_update = `
    update user set
    password=?, name=?, emailid=?, emaildomain=?, 
    tel1=?, tel2=?, tel3=?, zip_code=?, address=?, detail_address=?
    where id=?
    `;
    let user_check= `
        select *
        from user
        where id = ?
    `;
    pool.getConnection((err, connection) => {
        connection.query(user_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(user_check, [id], (err, userresults, fields) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                sess.userid = id;
                sess.name = name;
                sess.grade = userresults[0].grade;
                req.session.save(() => {
                    res.redirect('/');
                });
            });
        });
    });
});

router.get('/user_student_add', (req, res) => {
    let id_select = `
        select id
        from user
    `;
    let ids = new Array();
    pool.getConnection((err, connection) => {
        connection.query(id_select, (err, results, fields) => {
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

    let student_select = `
    select * from student 
    where class = ? and
    name = ?
    `;
    let relation_insert = `
    insert into relation (student_id, parents_id)
    values(?, ?)
    `;
    let user_update = `
    update user set
    grade = 'P'
    where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(student_select, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            
            if (result.length > 0) {
                let realation_values = [result[0].id, id];
                connection.query(relation_insert, realation_values, (err, result) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    connection.query(user_update, id, (err, result) => {
                        connection.release();
                        sess.grade = 'P';
                        res.redirect('/home');
                    });
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
    res.redirect('/user/login');
});

module.exports = router;