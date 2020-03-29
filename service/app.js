const express = require('express');
const app = express();

app.get('/', function (req, res) {
  res.send('Hello World!')
});

var server = app.listen(8080, function () {
  console.log('Listening on port ' + server.address().port);
});
