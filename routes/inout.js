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

module.exports = router;