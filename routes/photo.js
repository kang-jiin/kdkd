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
    res.render('photo/photo');
})




module.exports = router;