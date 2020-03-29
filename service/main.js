const config = require('config');
const YAML = require('yaml');
const fs = require('fs');
const { exec } = require('child_process');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var path = require('path');

const INDEX_PATH = path.join(__dirname, 'index.html');
const STATIC_PATH = path.join(__dirname, 'static');
const UGC_PATH = path.join(STATIC_PATH, 'ugc');

app.engine('html', require('ejs').renderFile);
app.use(express.static(STATIC_PATH));
app.use(morgan('common'));

app.get('/', function (req, res) {
  res.render(INDEX_PATH);
});

var generateBodyParser = bodyParser.text({
  type: 'text/plain',
  limit: config.get('upload-limit')
});

app.post('/generate', generateBodyParser, function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  function onResult(output, err) {
    if (err) {
      console.error(err);
      res.end(JSON.stringify({
        'recipe': null,
        'error': 500
      }));
    } else {
      res.end(JSON.stringify({
        'recipe': output,
        'error': null
      }));
    }
  };

  try {
    var output = "";
    var error = "";
    var cmd = exec(
      `pandoc --template=${TEMPLATE_INDEX_HTML_PATH} --css=${TEMPLATE_INDEX_CSS_PATH} --self-contained`,
      function(err, stdout, stderr) {
        if (err) {
          console.error(`pandoc exited with error code ${err}`);
          onResult(null, stderr);
        } else {
          onResult(stdout, null);
        }
      }
    );

    cmd.stdin.write(`---\n${YAML.stringify(YAML.parse(req.body))}\n---`);
  } catch(error) {
    onResult(null, error);
  }
});

function run() {
  const port = config.get('port');
  app.listen(port, function () {
      console.log(`Listening on port ${port}`);
  });
}

run();
