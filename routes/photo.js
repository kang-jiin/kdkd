//////////////////////////////////////////////////////////////
//                          앨범                            //
//////////////////////////////////////////////////////////////
const fs = require('fs');
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

//--------------파일 업로드---------------
const multer = require('multer');
const uploadformat = require('../public/js/uploadformat');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let upload_folder = uploadformat.dateFormat();
        let real_folder = './uploads/' + upload_folder;
        fs.access(real_folder, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) {
                if (err.code = 'ENOENT') {
                    fs.mkdir(real_folder, (err) => {
                        if (err) {
                            throw err;
                        }
                        cb(null, real_folder);
                    });
                }
            } else {
                cb(null, real_folder);
            }
        });
    },
    filename: function (req, file, cb) {
        let oname = file.originalname;
        let idx = oname.lastIndexOf('.');
        cb(null, oname.substring(0, idx) + uploadformat.timeFormat() + oname.substring(idx));
    }
});

var upload = multer({ storage: storage });
//--------------파일 업로드---------------

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
});

router.get('/photo_info',(req, res)=>{
    let num = req.query.num;
    
    let hit_update = `
    update photo
    set hit= hit+1
    where id=?
    `;
    let select_photo = `
    select p.id as id, u.id as writer_id, u.name as name, p.title as title, p.savefolder, p.savename, 
    date_format(p.time, '%Y-%m-%d') as time, p.hit as hit
    from photo p, user u
    where p.writer_id = u.id
    and p.id = ?
    `;
    pool.getConnection((err, connection)=>{
        connection.query(hit_update,[num],(err)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.query(select_photo, num,(err, results)=>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!');
                }
                res.render('photo/photo_info', {article: results[0]});
            });
        });
    });   
});

router.get('/add',(req,res)=>{
    res.render('photo/add');
})

router.post('/add', upload.single('picture'), (req,res)=>{
    let writer_id = req.session.userid;
    let title = req.body.title;
    let savefolder = uploadformat.dateFormat();
    let originalname = req.file.originalname;
    let savename = req.file.filename;

    let values = [writer_id, title, savefolder, originalname, savename];
    let photo_insert = `
        insert into photo (writer_id, title, savefolder, originalname, savename)
        values (?, ?, ?, ?, ?)
    `;

    pool.getConnection((err, connection) => {
        connection.query(photo_insert, values, (err) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            connection.release();
            res.redirect('/photo');
        });
    });
})

router.get('/modify',(req,res)=>{
    res.render('photo/add');
})

router.get('/delete',(req,res)=>{
    let num = req.query.num;
    
    let photo_data = `
        select *
        from photo
        where id = ?
    `;
    let photo_delete = `
        delete from photo
        where id = ?
    `;

    console.log(num);
    
    pool.getConnection((err, connection) => {
        connection.query(photo_data, num, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!');
            }
            console.log(result);
            connection.query(photo_delete, num, (err) => {
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!');
                }
                if (result[0].savefolder) {
                    fs.unlink('./uploads/' + result[0].savefolder + '/' + result[0].savename, (err) => {
                        if (err) {
                            console.log(err);
                            conn.release();
                            throw err;
                        }
                    });
                }
                res.redirect('/photo');
            });
        });
    });
})


module.exports = router;