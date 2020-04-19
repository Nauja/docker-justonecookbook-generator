// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const sandboxYaml = "https://raw.githubusercontent.com/Nauja/pandoc-cookbook-template/master/example/sandbox.yaml";

$(document).ready(function() {
	function FormEditor() {
  		let form = $("#pr-editor-form");
  		let title = form.find("#pr-editor-form-title").first();
  		let course = form.find("#pr-editor-form-course").first();
  		let cuisine = form.find("#pr-editor-form-cuisine").first();
  		let difficulty = form.find("#pr-editor-form-difficulty").first();
  		let summary = form.find("#pr-editor-form-summary").first();

		return {
			"this": form,
			"from_source": function(source) {
				let obj = jsyaml.load(source);
				title.val(obj["title"]);
				course.val(obj["course"]);
				cuisine.val(obj["cuisine"]);
				difficulty.val(obj["difficulty"]);
				summary.val(obj["summary"]);
			}
		};
	}

  var source_editor = ace.edit("pr-editor-source");
  var form_editor = new FormEditor();
  source_editor.setTheme("ace/theme/monokai");
  source_editor.setOptions({
    fontSize: "14px"
  });
  source_editor.session.setMode("ace/mode/yaml");
  source_editor.focus();

  $.get(sandboxYaml, function(data) {
    data = data.substring(data.indexOf("\n") + 1);
    data = data.substring(data.lastIndexOf("\n"), -1 );
    data = data.substring(data.lastIndexOf("\n"), -1 );
    data = data + "\n";
    source_editor.setValue(data, -1);
    source_to_form();
  });

	function source_to_form() {
		form_editor.from_source(source_editor.getValue());
	}

  $("#pr-toolbar-print").click(function() {
    document.getElementById('pr-preview').contentWindow.print();
  });

	function generate_recipe(content, template, success, error) {
		$.ajax({
			url: "/generate",
			type: "POST",
			contentType: "application/json",
			dataType: "json",
			data: JSON.stringify({
				recipe: content,
				template: template
			}),
			success: function(response) {
				if (response["result"] != "Ok")
				{
					error(response["error"]);
				}
				else
				{
					success(response["params"]["result"]);
				}
			}
		});
	}

  var isRunning = false;
	$("#pr-toolbar-run").click(function() {
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
	    $("#pr-toolbar-spinner").append(spinner.el);

		generate_recipe(
			source_editor.getValue(),
			$("#pr-template").val(),
			function(generated) {
	          isRunning = false;
	          spinner.stop();
				$("#pr-preview").attr('src', generated);
          		$("#pr-block").removeClass("pr-hidden");
			},
			function(error) {
	          isRunning = false;
	          spinner.stop();
				alert(JSON.stringify(error));
			}
		);
	});
});
