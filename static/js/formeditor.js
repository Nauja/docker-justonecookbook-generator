var FormEditor = function() {
	this.root = $("#pr-editor-form");

	var DynamicList = function(root, item_class, button_label) {
		this._root = root;
		this._item_class = item_class;
		this._items = [];

		this._add_button = $('<div/>', {'class': 'row'}).append(
			$('<div/>', {'class': 'col'}),
			$('<div/>', {'class': 'col-auto'}).append(
				$('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': button_label})
			)
		);

		this._add_button.click(() => this.add());

		this._root.append(this._add_button);

		this.add();
	};
	
	DynamicList.prototype = {
		_on_action: function(item) {
			if (item.is_single) {
				this.add();
			} else {
				item.root.remove();
				let index = this._items.indexOf(item);
				this._items.splice(index, 1);
				if (this._items.length == 1) {
					this._items[0].set_single(true);
				}
			}
		},
		add: function() {
			let size = this._items.length;
			if (size > 0) {
				this._items[size - 1].set_single(false);
			}
			let item = new this._item_class();
			item.set_single(size == 0);
			item.action(() => {
				this._on_action(item);
			});
			this._add_button.before(item.root);
			this._items.push(item);
		}
	};

	/**
	 * One instruction line with a delete button.
	 */
	var Instruction = function() {
		this.root = $('<div/>', {'class': 'row'}).append(
			$('<div/>', {'class': 'col'}).append(
				$('<input/>', {'class': 'pr-editor-form-instruction', 'type': 'text'})
			),
			$('<div/>', {'class': 'col-auto'}).append(
				$('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': 'Delete'})
			)
		);

		this.is_single = false;
		this._action = $.Callbacks();
		this._field = this.root.find(".pr-editor-form-instruction").first();
		this._button = this.root.find(".pr-editor-form-button").first();

		this._button.click(() => {
			this._action.fire();
		});

		this._update();
	};
	
	Instruction.prototype = {
		_update: function() {
			if (this.is_single) {
				this._button.prop("disabled", true);
				this._button.addClass("pr-hidden");
			} else {
				this._button.prop("disabled", false);
				this._button.removeClass("pr-hidden");
			}
		},
		set_single: function(value) {
			this.is_single = value;
			this._update();
		},
		action: function(cb) {
			this._action.add(cb);
		}
	};

	var Group = function() {
		this.root = $('<div/>', {'class': 'pr-editor-form-group'}).append(
			$('<div/>', {'class': 'row'}).append(
				$('<div/>', {'class': 'col'}).append(
					$('<label/>', {'class': 'pr-editor-form-group-label', 'text': 'Group'})
				),
				$('<div/>', {'class': 'col-auto'}).append(
					$('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': 'Delete'})
				),
			),
			$('<div/>', {'class': 'pr-editor-form-group-content'}).append(
				$('<label/>', {'class': 'pr-fill', 'text': 'Title:'}),
				$('<input/>', {'type': 'text:'}),
				$('<label/>', {'class': 'pr-fill', 'text': 'Instructions:'})
			)
		);

		this.is_single = false;
		this._action = $.Callbacks();
		this._label = this.root.find(".pr-editor-form-group-label").first();
		this._button = this.root.find(".pr-editor-form-button").first();
		this._content = this.root.find(".pr-editor-form-group-content").first();

		this._instructions = new DynamicList(
			this.root.find(".pr-editor-form-group-content").first(),
			Instruction,
			"New Instruction"
		);

		this._button.click(() => {
			this._action.fire();
		});

		this._update();
	};
	
	Group.prototype = {
		_update: function() {
			if (this.is_single) {
				this._button.prop("disabled", true);
				this._button.addClass("pr-hidden");
			} else {
				this._button.prop("disabled", false);
				this._button.removeClass("pr-hidden");
			}
		},
		set_single: function(value) {
			this.is_single = value;
			this._update();
		},
		action: function(cb) {
			this._action.add(cb);
		}
	};

	this._widgets = {
		"title": this.root.find("#pr-editor-form-title").first(),
		"cuisine": this.root.find("#pr-editor-form-cuisine").first(),
		"difficulty": this.root.find("#pr-editor-form-difficulty").first(),
		"rating": this.root.find("#pr-editor-form-rating").first(),
		"keyword": this.root.find("#pr-editor-form-keyword").first(),
		"summary": this.root.find("#pr-editor-form-summary").first(),
		"instructions": this.root.find("#pr-editor-form-instructions").first()
	};

	this._groups = new DynamicList(
		this._widgets.instructions,
		Group,
		"New Group"
	);
};

FormEditor.prototype = {
	hide: function() {
		this.root.addClass("pr-hidden");
	},
	show: function() {
		this.root.removeClass("pr-hidden");
	},
	from_source: function(source) {
		let obj = jsyaml.safeLoad(source);
		let stars = 0;
		obj["rating"].forEach(item => {
			if("fill" in item)
				stars += 1;
		});
		this._widgets.title.val(obj["title"]);
		this._widgets.cuisine.val(obj["cuisine"]);
		this._widgets.difficulty.val(obj["difficulty"]);
		this._widgets.rating.val(stars);
		this._widgets.keyword.val(obj["keyword"]);
		this._widgets.summary.val(obj["summary"]);
	},
	to_source: function() {
		let stars = [];
		let stars_count = this._widgets.rating.val();
		for (let i = 1; i <= 5; ++i) {
			if (stars_count >= i)
				stars.push({"fill": 1});
			else
				stars.push({"empty": 1});
		}
		let obj = {
			"title": this._widgets.title.val(),
			"cuisine": this._widgets.cuisine.val(),
			"difficulty": this._widgets.difficulty.val(),
			"rating": stars,
			"keyword": this._widgets.keyword.val(),
			"summary": this._widgets.summary.val()
		}
		return jsyaml.safeDump(obj);
	}
};