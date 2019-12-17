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

    let inout_select;
    if(grade == 'P') {  //일반 계정
        inout_select = `
            select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no
            from relation, student, in_out
            where relation.student_id = student.id 
            and student.id = in_out.student_id 
            and in_out.in_out_flag = ? 
            and relation.parents_id = ?
            order by in_out.time desc
        `;
    }
    else if(grade == 'A') { //관리자 계정
        inout_select = `
            select date_format(in_out.time, '%Y-%m-%d %H:%i:%s') as time, student.name as name, in_out.id as no
            from student, in_out
            where student.id = in_out.student_id 
            and in_out.in_out_flag = ?
            order by in_out.time desc
        `;
    }
    pool.getConnection((err, connection) => {
        connection.query(inout_select, ['in', id], (err, result1) =>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(inout_select, ['out',id], (err, result2) =>{
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

module.exports = router;