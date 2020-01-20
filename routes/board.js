//////////////////////////////////////////////////////////////
//                      게시판                              //
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
    
    let select_board = `
    select b.id as id, u.name as name, b.title as title, b.content as content, 
    case
    when date_format(b.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(b.time, '%H:%i:%s')
    else date_format(b.time, '%Y-%m-%d')
    end as time, b.hit as hit
    from board b, user u
    where b.writer_id = u.id
    order by b.id desc
    LIMIT ?, ?
    `;

    let select_count =`
    select count(*) as num
    from board
    `;
    pool.getConnection((err, connection) => {
        connection.query(select_board,[(page * 15) - 15, 15], (err, c_results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_count, (err, countes) =>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.release();
                res.render('board/board', { articles: c_results, pages: Math.ceil(countes[0].num/15), current: page});    
            })
        });
    });
});

router.get('/view', (req, res) => {
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
    select c.id as id, u.name as writername, u.id as writerid, c.content as content, 
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

router.get('/write', (req, res) => {
    res.render('board/write');
});

router.get('/write_content', (req, res) => {
    res.render('board/write_content');
});

router.post('/write', (req, res) => {
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

router.get('/modify', (req, res) => {
    let num = req.query.num;

    let select_board = `
        select * 
        from board
        where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(select_board, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            res.render('board/modify', { article: result[0] });
        });
    });
});

router.get('/modify_content', (req, res) => {
    res.render('board/modify_content');
});

router.post('/modify', (req, res) => {
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

router.get('/delete', (req, res) => {
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

router.post('/comment/add', (req, res) => {
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

router.get('/comment/delete', (req, res) => {
    let cnum = req.query.cnum;
    let bnum = req.query.bnum

    let comment_delete = `
        delete from comments
        where id = ?
    `;
    pool.getConnection((err, connection) => {
        connection.query(comment_delete, cnum, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.release();
            res.redirect('/board/view?num=' + bnum);
        });
    });
});

module.exports = router;