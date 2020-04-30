var SourceEditor = function(root) {
	let editor = root;

	let ace_editor = ace.edit("pr-editor-source");
	ace_editor.setTheme("ace/theme/monokai");
	ace_editor.setOptions({
		fontSize: "14px"
	});
	ace_editor.session.setMode("ace/mode/yaml");
	ace_editor.focus();

	return {
		"this": editor,
		"hide": function() {
			editor.addClass("pr-hidden");
		},
		"show": function() {
			editor.removeClass("pr-hidden");
		},
		"val": function(value) {
			if (!value) {
				return ace_editor.getValue();
			} else {
				ace_editor.setValue(value, -1);
			}
		}
	};
};

SourceEditor.prototype = {

};