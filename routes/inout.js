//////////////////////////////////////////////////////////////
//                       등하원                             //
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
    const sess = req.session;
    let id = sess.userid;
    let grade = sess.grade;

    let searchdate = req.query.searchdate;
    if (searchdate == undefined) {
        var today = new Date();
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        searchdate = yyyy + '-' + mm;
    }

    let inout_select;
    if(grade == 'A') { //관리자 계정
        inout_select = `
            select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no, in_out.code as code
            from student, in_out
            where student.id = in_out.student_id 
            and date_format(in_out.time, '%Y-%m') = ?
            and in_out.in_out_flag = ?
            order by in_out.time desc
        `;
    }
    else {  //일반 계정
        inout_select = `
            select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no, in_out.code as code
            from relation, student, in_out
            where relation.student_id = student.id 
            and student.id = in_out.student_id 
            and date_format(in_out.time, '%Y-%m') = ?
            and in_out.in_out_flag = ? 
            and relation.parents_id = ?
            order by in_out.time desc
        `;
    }

    let cal_select =`
    select date_format(time, '%Y') as year, date_format(time, '%m') as month, date_format(time, '%d') as day,
    concat(s.name, " ", date_format(time, '%H:%i'), " ", case when io.in_out_flag = 'in' then "등원" else "하원" end) as content, io.in_out_flag
    from relation r, student s,
    (select student_id, min(time) as time, in_out_flag
    from in_out
    where code = 'main'
    and in_out_flag = 'in'
    group by student_id, date_format(time, '%Y-%m-%d')
    union
    select student_id, max(time) as time, in_out_flag
    from in_out
    where code = 'main'
    and in_out_flag = 'out'
    group by student_id, date_format(time, '%Y-%m-%d')) io
    where r.student_id = io.student_id
    and r.student_id = s.id
    and r.parents_id = ?
    order by time
    `;

    pool.getConnection((err, connection) => {
        connection.query(inout_select, [searchdate, 'in', id], (err, result1) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(inout_select, [searchdate, 'out', id], (err, result2) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.query(cal_select, id, (err, calresults) => {
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    res.render('inout/inout', { ins: result1, outs: result2, searchdate: searchdate, calresults: calresults });
                });
            });
        });
    });
});

module.exports = router;