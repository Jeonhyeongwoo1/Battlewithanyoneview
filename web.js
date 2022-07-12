const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const AES256Crypto = require('./routes/AES256Utils');
const usersRouter = require('./routes/users');
const bodyParser = require('body-parser');
const url = require('url');

const express = require('express')
const mysql = require("mysql");
const { query } = require('express');
const res = require('express/lib/response');
const mysql_dbc = require('./config/db_con')();
const PORT = 8001

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/users', usersRouter);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render("index");
});

app.post("/login", async function (req, res) {

  console.log("Login ....");
  const id = req.body.id;
  const pw = req.body.password;
  const connection = mysql_dbc.init();
  connection.connect();

  const query = "SELECT * FROM member WHERE mbr_id = ? AND mbr_pwd = ? LIMIT 1";
  connection.query(query, [id, pw], async function (err, result, fields) {
    if (err) {
      console.log(err);
    }

    if (result.length > 0) {
      let plainTextData = Math.random().toString(36).slice(2);
      let encryptStr = AES256Crypto.aes256Encrypt(plainTextData);
      var isUpdate = await UpdateMemberToken(encryptStr, id, connection);
      if (isUpdate == "Success") {
        result[0].mbr_token = encryptStr;
        res.send(result[0]);
      } else {
        res.send(null);
      }

    } else {
      res.send(null);
    }
  });
});

app.post("/deleteAccount", (req, res) =>{

  console.log("delete Account");
  const id = req.body.id;
  const password = req.body.password;
  const email = req.body.email;
  const connection = mysql_dbc.init();
  connection.connect();
console.log(id);
console.log(password);
console.log(email);
  const query = "DELETE FROM member WHERE mbr_id = ? AND mbr_pwd = ? AND mbr_email = ?";
  connection.query(query, [id, password, email], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    if (result.affectedRows == 1) {
      res.send("success");
    } else {
      res.send("failed");
    }
  });


});

app.get("/findId/:email", (req, res) => {

  console.log("Find id..");
  const email = req.params.email;
  const connection = mysql_dbc.init();
  connection.connect();

  const query = "SELECT mbr_id FROM member WHERE mbr_email = ?";
  connection.query(query, [email], (err, result, fields) => {
    if (err) {
      console.log(err);
      res.send(null);
    }else{
      res.send(result[0]);
    }
    
  });

});

app.get("/findPw/:id/:email", (req, res) => {

  console.log("Find password..");
  const email = req.params.email;
  const id = req.params.id;
  const connection = mysql_dbc.init();
  connection.connect();

  const query = "SELECT * FROM member WHERE mbr_email = ? and mbr_id = ?";
  connection.query(query, [email, id], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    if (result.length > 0) {
      res.send(result[0]);
    } else {
      res.send(null);
    }
  });

});


app.get("/checkToken/:token", (req, res) => {

  console.log("Check Toekn");
  const connection = mysql_dbc.init();
  connection.connect();

  const token = req.params.token;
  const query = "SELECT * from member where mbr_token = ?";
  connection.query(query, [token], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    if (result.length > 0) {
      res.send(result[0].mbr_token);
    }
    else {
      res.send(null);
    }

  });
});

app.get("/checkId/:id", (req, res) => {

  console.log("Check Id...");
  const id = req.params.id;

  const connection = mysql_dbc.init();
  connection.connect();

  const query = "SELECT mbr_id FROM member WHERE mbr_id = ?";
  connection.query(query, [id], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    if (result.length > 0) {
      res.send("exist");
    } else {
      res.send("Not exist");
    }

  });

});

app.post("/signup", (req, res) => {

  console.log("User signup...");
  const id = req.body.id;
  const password = req.body.pw;
  const email = req.body.email;
  const name = req.body.name;
  const connection = mysql_dbc.init();
  connection.connect();

  const checkIdQuery = "SELECT mbr_id FROM member WHERE mbr_id = ?";
  connection.query(checkIdQuery, [id], (err, result, fields) => {
    if (err) {
      console.log(err);
    }
    if (result.length <= 0) {
      signupMember(id, password, email, name, res);
    } else {
      res.send(result[0]);
    }
  });

});

app.post("/updateUserName", (req, res) => {
  
  console.log("updateUserName...");
  const userName = req.body.userName;
  const appleId = req.body.appleId;
  const connection = mysql_dbc.init();
  connection.connect();
  const query = "UPDATE appleMember SET apple_name = ? WHERE apple_id = ?";
  connection.query(query, [userName, appleId], (err, result, fields) => {
    if (err) {
      console.log(err);
    }
    
    if (result.changedRows == 1) {
      res.send("success");
    }else{
      res.send("failed");
    }
  });
});

const signupMember = function (id, password, email, name, res) {

  const connection = mysql_dbc.init();
  connection.connect();

  const query = "INSERT INTO member(mbr_id, mbr_pwd, mbr_email, mbr_nm) VALUES (?, ?, ?, ?)";
  connection.query(query, [id, password, email, name], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    res.send(result);
  });
}

async function UpdateMemberToken(token, id, connection) {
  return new Promise(function (resolve, reject) {
    const query = "UPDATE member SET mbr_token = ? where mbr_id = ?";
    connection.query(query, [token, id], (err, result, fields) => {
      if (err) {
        console.log(err);
      }

      if (result.changedRows == 1) {
        resolve("Success");
      }
      else {
        resolve("failed");
      }
    });
  });

}

app.post("/appleLogin", (req, res) => {

  console.log("Apple Login..");
  const connection = mysql_dbc.init();
  connection.connect();

  const email = req.body.email;
  const name = req.body.name;
  const appleId = req.body.appleId;
  const authCode = req.body.authCode;
  const query = "SELECT apple_name FROM appleMember WHERE apple_id = ?";
  connection.query(query, [appleId], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    if (result.length > 0) {
      res.send(result[0].apple_name);
      return;
    }

    var query = "INSERT INTO appleMember(apple_id, auth_code, apple_name, apple_email) VALUES (?, ?, ?, ?)";
    connection.query(query, [appleId, authCode, email, name], (err, result, fields) => {
      if (err) {
        console.log(err);
        res.send(null);
        return;
      }

      res.send("success");
    });
  });

});

app.post("/appleUpdateToken", (req, res) => {

  console.log("Apple update Token..");
  const connection = mysql_dbc.init();
  connection.connect();

  const token = req.body.token;
  const id = req.body.id;
  const query = "update appleMember set apple_token = ? where apple_id = ?";
  connection.query(query, [token, id], (err, result, fields) => {
    if (err) {
      console.log(err);
    }

    res.send(result);
    console.log(result);
  });

});

app.post("/updatePw", (req, res) => {

  console.log("Update Password");
  const connection = mysql_dbc.init();
  connection.connect();

  const password = req.body.pw;
  const email = req.body.email;
  const query = "Update member set mbr_pwd = ? where mbr_email = ?  ";
  connection.query(query, [password, email], (err, result, fields) => {
    if (err) {
      console.log(err);
      res.send(null);
      return;
    }

    res.send(result);
  });
});

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`)
});