// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const sandboxYaml = "https://raw.githubusercontent.com/Nauja/pandoc-cookbook-template/master/example/sandbox.yaml";

$(document).ready(function() {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.setOptions({
    fontSize: "14px"
  });
  editor.session.setMode("ace/mode/yaml");
  editor.focus();

  $.get(sandboxYaml, function(data) {
    data = data.substring(data.indexOf("\n") + 1);
    data = data.substring(data.lastIndexOf("\n"), -1 );
    data = data.substring(data.lastIndexOf("\n"), -1 );
    data = data + "\n";
    editor.setValue(data, -1);
  });

  var isRunning = false;
  $("#toolbar-run").click(function() {
    if (isRunning)
      return;
    isRunning = true;

    var spinner = new Spinner({
      lines: 10, // The number of lines to draw
      length: 4.5, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      color: '#ffffff', // CSS color or array of colors
      fadeColor: 'transparent', // CSS color or array of colors
      speed: 1, // Rounds per second
      rotate: 0, // The rotation offset
      animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
      direction: 1, // 1: clockwise, -1: counterclockwise
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      className: 'spinner', // The CSS class to assign to the spinner
      top: '50%', // Top position relative to parent
      left: '20px', // Left position relative to parent
      shadow: '0 0 1px transparent', // Box-shadow for the lines
    }).spin();
    $("#toolbar-spinner").append(spinner.el);

    setTimeout(function() {
      $.ajax({
        url: "/generate",
        type: "POST",
        data: editor.getValue(),
        dataType: "text",
        contentType: "text/plain; charset=utf-8",
        success: function(data) {
          isRunning = false;
          spinner.stop();
          var result = JSON.parse(data);
          $("#recipe").attr("src", result["url"]);
          $("#recipe-block").removeClass("recipe-hidden");
        }
      });
    }, 1000);
  });

  $("#toolbar-open").click(function() {
    window.open($("#recipe").attr("src"));
  });
});
