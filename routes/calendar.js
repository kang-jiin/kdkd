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
    select concat(name, " 생일") as content, date_format(birth, '%m') as month, date_format(birth, '%d') as day 
    from student
    `;
    let select_cal = `
    select content, date_format(time, '%Y') as year, date_format(time, '%m') as month, date_format(time, '%d') as day 
    from calendar
    `;
    pool.getConnection((err, connection) =>{
        connection.query(select_birth, (err, birth_results)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_cal, (err, cal_results)=>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                res.render('calendar/calendar', {birth_results : birth_results, cal_results: cal_results});
            });
        });
    });
});

router.get('/add', (req, res) => {
    res.render('calendar/add');
});

router.post('/add', (req, res) => {
    let caldate = req.body.caldate;
    let content = req.body.content;

    let values = [caldate, content];
    let calendar_insert = `
    insert into calendar (time, content)
    values(?, ?)`;

    pool.getConnection((err, connection) => {
        connection.query(calendar_insert, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/calendar');
        });
    });
});
//수정 부분
router.get('/modify', (req,res)=>{

    res.render('calendar/modify');
});


module.exports = router;