// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var $ = require('jquery');
const config = require('config');

var request = require('request');
request.get(config.get("sandbox-yaml"), function(error, response, body) {
  if (!error && response.statusCode == 200)
  {
    $("#gen-source").text(body);
  }
});
