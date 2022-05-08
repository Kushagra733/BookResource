const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const user = require("./dummyuser"); //Made a dummy user for Authentication Purpose.

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect("mongodb://localhost:27017/bookDB", function (err) {
  if (err) console.log(err);
  else console.log("Connected to Database!");
});

const bookschema = mongoose.Schema({
  name: String,
  image: String,
  author: String,
  pages: Number,
  price: Number,
});

const Book = mongoose.model("Book", bookschema);

app.post("/login", function (req, res) {
  // Sends a post request to server with login credentials
  //and if found creates a json token.
  var username = req.body.username;
  var password = req.body.password;

  if (username === user.username && password === user.password) {
    jwt.sign({ user }, "mysecretkey", { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.log(err);
      } else res.send(token);
    });
  } else {
    console.log("ERROR: Could not log in");
  }
});

const checkToken = (req, res, next) => {
  // Checks the token with bearer on postman app.
  const header = req.headers["authorization"];

  if (typeof header !== "undefined") {
    const bearer = header.split(" ");
    const token = bearer[1];

    req.token = token;
    next();
  } else {
    res.sendStatus(403);
  }
};

app
  .route("/books") // gets all the books
  .get(checkToken, function (req, res) {
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        Book.find((err, foundbooks) => {
          if (!err) res.send(foundbooks);
          else res.send(err);
        });
        console.log("SUCCESS: Connected to protected route");
      }
    });
  })
  .post(checkToken, function (req, res) {
    // post a book to the database
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        //If error send Forbidden (403)
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        var newbook = new Book({
          name: req.body.name,
          image: req.body.image,
          author: req.body.author,
          pages: req.body.pages,
          price: req.body.price,
        });

        newbook.save(function (err) {
          if (err) res.send(err);
          else res.send("book creation successful!");
        });
        console.log("SUCCESS: Connected to protected route");
      }
    });
  });

app
  .route("/books/:bookname") // gets a book with the name
  .get(checkToken, function (req, res) {
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        Book.findOne({ name: req.params.bookname }, function (err, foundbook) {
          if (err) res.send("No matching books found");
          else res.send(foundbook);
        });
        console.log("SUCCESS: Connected to protected route");
      }
    });
  })
  .put(checkToken, function (req, res) {
    // updates the whole document with given bookname
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        Book.updateOne(
          { name: req.params.bookname },
          {
            name: req.body.name,
            image: req.body.image,
            author: req.body.author,
            pages: req.body.pages,
            price: req.body.price,
          },
          { overwrite: true },
          function (err) {
            if (!err) res.send("successfully updated article.");
          }
        );
        console.log("SUCCESS: Connected to protected route");
      }
    });
  })
  .patch(function (req, res) {
    // updates only the given info in the document in database.
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        Book.updateOne(
          { name: req.params.bookname },
          { $set: req.body },
          function (err) {
            if (err) res.send(err);
            else res.send("updated successfully!");
          }
        );
        console.log("SUCCESS: Connected to protected route");
      }
    });
  })
  .delete(function (req, res) {
    // deletes a document with a given name.
    jwt.verify(req.token, "mysecretkey", (err, authorizedData) => {
      if (err) {
        console.log("ERROR: Could not connect to the protected route");
        res.sendStatus(403);
      } else {
        //If token is successfully verified, we can send the autorized data
        Book.deleteOne({ name: req.params.bookname }, function (err) {
          if (err) res.send(err);
          else res.send("Deleted Sucessfully!");
        });
        console.log("SUCCESS: Connected to protected route");
      }
    });
  });

app.listen(3000);
