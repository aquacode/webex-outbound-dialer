const express = require("express");
const path = require("path");
const private_app = express();
const public_app = express();

private_app.use(express.static(path.join(__dirname, 'public')))
private_app.get(`/`, function (req, res, next) {
  res.sendFile(__dirname + `/launch.html`)
});


// ..
public_app.use(express.static("public"));

public_app.get(`/`, function (req, res, next) {
  res.sendFile(__dirname + `/launch.html`)
});

public_app.get(`/public/webex.js`, function (req, res, next) {
  res.sendFile(__dirname + `/public/webex.js`)
});

public_app.get(`/public/bridge.js`, function (req, res, next) {
  res.sendFile(__dirname + `/public/bridge.js`)
});

const private_listener = private_app.listen(process.env.HIDDEN_PORT, function() {
  console.log("Your private_app is listening on port " + private_listener.address().port);
});

const public_listener = public_app.listen(process.env.PORT, function() {
  console.log("Your public_app is listening on port " + public_listener.address().port);
});
