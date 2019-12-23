//////////////////////////////////////////////////////////////
//                          앨범                            //
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

router.get('/',(req,res)=>{
    let page = req.query.page;
    if(req.query.page != undefined) page = req.query.page;
    else page= 1;

    let select_photo = `
    select p.id as id, u.name as name, p.title as title, p.savefolder, p.savename,
    case
    when date_format(p.time, '%Y-%m-%d')=date_format(now(), '%Y-%m-%d')
    then date_format(p.time, '%H:%i:%s')
    else date_format(p.time, '%Y-%m-%d')
    end as time, p.hit as hit
    from photo p, user u
    where p.writer_id = u.id
    order by p.id desc
    LIMIT ?,?
    `;

    let select_count =`
    select count(*) as num
    from photo
    `;
    pool.getConnection((err, connection)=>{
        connection.query(select_photo,[(page*9)-9, 9], (err, c_results)=>{
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
                res.render('photo/photo', { c_article : c_results, pages: Math.ceil(countes[0].num/15), current: page});   
            })        
        });
    });
    
})




module.exports = router;