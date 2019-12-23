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
    res.render('photo/photo');
})

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



module.exports = router;