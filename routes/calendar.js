//////////////////////////////////////////////////////////////
//                          일정                            //
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

module.exports = router;