// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
$(document).ready(function() {
	function Switch(first, second) {
		function update(selected, unselected) {
			unselected.removeClass("pr-toolbar-selected");
			selected.addClass("pr-toolbar-selected");
		}

		let on_selected = $.Callbacks();

		first.click(function() {
			update(first, second);
			on_selected.fire(0);
		});

		second.click(function() {
			update(second, first);
			on_selected.fire(1);
		});

		return {
			"select": function(index) {
				update(
					index == 0 ? first : second,
					index == 0 ? second : first
				);
			},
			"selected": function(cb) {
				on_selected.add(cb);
			}
		};
	}

	let editor_mode = Switch(
		$("#pr-toolbar-yaml"),
		$("#pr-toolbar-form")
	);

	let source_editor = new SourceEditor($("#pr-editor-source"));
	let form_editor = new FormEditor($("#pr-editor-form"));

	function fetch_template() {
		$.get($("#pr-editor-source").attr("data-template-url"), function(data) {
			source_editor.val(data);
			form_editor.from_source(source_editor.val());
		});
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

		let source = form_editor.to_source();

		generate_recipe(
			source_editor.val(),
			$("#pr-toolbar-template").val(),
			function(generated) {
	        	isRunning = false;
	        	spinner.stop();
				$("#pr-preview").attr('src', generated + "#view=FitV");
          		$("#pr-block").removeClass("pr-hidden");
			},
			function(error) {
	        	isRunning = false;
	        	spinner.stop();
				alert(JSON.stringify(error));
			}
		);
	});

	fetch_template();

	editor_mode.selected(function(index) {
		if (index == 0) {
			form_editor.hide();
			source_editor.show();
		} else {
			source_editor.hide();
			form_editor.show();
		}
	});

	editor_mode.select(1);
});
