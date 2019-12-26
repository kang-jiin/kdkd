//////////////////////////////////////////////////////////////
//                      알림장                              //
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
    let page = req.query.page;
    if(req.query.page != undefined) page = req.query.page;
    else page= 1;

    let classname;
    if(req.query.class != undefined) classname = req.query.class;
    else classname = "햇님반";

    let notice_select = `
    select n.id as id, u.id as writer_id, u.name as name, n.title as title, n.content as content, 
    case
    when date_format(n.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(n.time, '%H:%i:%s')
    else date_format(n.time, '%Y-%m-%d')
    end as time
    from notice n, user u
    where n.writer_id = u.id
    and n.class = ?
    order by n.id desc
    LIMIT ?, ?
    `;

    let count_select =`
    select count(*) as num
    from notice
    where class = ?
    `;
    
    pool.getConnection((err, connection) => {
        connection.query(notice_select, [classname, (page * 5) - 5, 5], (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(count_select, [classname], (err, countes) =>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.release();
                res.render('notice/notice', { classname: classname, articles: results, pages: Math.ceil(countes[0].num/5), current: page});    
            })
        });
    });
});

router.get('/write', (req, res) => {
    res.render('notice/write');
});

router.get('/write_content', (req, res) => {
    res.render('notice/write_content');
});

router.post('/write', (req, res) => {
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
            res.redirect('/notice?class='+classname);
        });
    });
});

router.get('/modify', (req, res) => {
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

router.get('/modify_content', (req, res) => {
    res.render('notice/modify_content');
});

router.post('/modify', (req, res) => {
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

router.get('/delete', (req, res) => {
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

module.exports = router;