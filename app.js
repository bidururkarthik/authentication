const express = require("express");
const app = express();

const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
let bcrypt = require("bcrypt");

const dbpath = path.join(__dirname, "userData.db");

let db = null;
app.use(express.json());

const intialserversetdatabase = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3001, () => {
      console.log("server start http://localhost/3000");
    });
  } catch (error) {
    console.log(`database error ${error.message}`);
    process.exit(1);
  }
};

intialserversetdatabase();

const validation = (password) => {
  return password.length > 4;
};

//API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashpassword = await bcrypt.hash(password, 10);

  const checkuserindatabasequery = `SELECT * FROM user WHERE username = '${username}'`;

  const dbresponse = await db.get(checkuserindatabasequery);
  //**Scenario 1**  If the username already exists

  if (dbresponse === undefined) {
    const createquery = `INSERT INTO user (username,name,password,gender,location)
     VALUES(
         '${username}',
         '${name}',
         '${hashpassword}',
         '${gender}',
         '${location}'
     )
     `;

    //    If the registrant provides a password with less than 5 characters

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createquery);
      response.send(`User Create successfully`);
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectuserquery = `SELECT * FROM user WHERE username='${username}';`;

  const responselogin = await db.get(selectuserquery);

  if (responselogin === undefined) {
    response.status(400);
    response.send("Invaild user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      responselogin.password
    );

    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selsectquery = `SELECT * FROM user WHERE username='${username}'`;
  const dbresponse = await db.get(selsectquery);

  if (dbresponse === undefined) {
    response.status(400);
    response.send("Invaild username");
  } else {
    const checkingpassword = await bcrypt.compare(
      oldPassword,
      dbresponse.password
    );

    if (checkingpassword === true) {
      if (validation(newPassword)) {
        const updatepassword = await bcrypt.hash(newPassword, 10);
        const updatequery = `
            UPDATE user
            SET
            password = '${updatepassword}'
            WHERE
            username = '${username}'
            `;
        await db.run(updatequery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
