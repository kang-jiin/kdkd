//////////////////////////////////////////////////////////////
//                      관리자 기능                          //
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

const router = require('express').Router();

router.get('/', (req, res) => {
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

router.get('/student_add', (req, res) => {
    res.render('admin/student_add');
});

router.post('/student_add', (req, res) => {
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

router.get('/student_modify', (req, res) => {
    let num = req.query.num;
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

router.post('/student_modify', (req, res) => {
    let num = req.query.num;
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

router.get('/student_delete', (req, res) => {
    let num = req.query.num;
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

module.exports = router;