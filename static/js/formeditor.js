var FormEditor = function(root) {
	this.root = root;

	var DynamicList = function(last_child, options) {
		this._last_child = last_child;
		this._items = [];
		this._allow_delete_single = options.allow_delete_single
	};
	
	DynamicList.prototype = {
		_on_action: function(item) {
			if (this._allow_delete_single || !item.is_single ) {
				item.root.remove();
				let index = this._items.indexOf(item);
				this._items.splice(index, 1);
				if (this._items.length == 1) {
					this._items[0].set_single(true);
				}
			}
		},
		add: function(item) {
			let size = this._items.length;
			if (size > 0) {
				this._items[size - 1].set_single(false);
			}
			item.set_single(size == 0);
			item.action(() => {
				this._on_action(item);
			});
			this._last_child.before(item.root);
			this._items.push(item);
		},
		length: function() {
			return this._items.length;
		},
		at: function(index) {
			return this._items[index];
		}
	};

	/**
	 * One instruction line with a delete button.
	 */
	var InstructionItem = function(options) {
		this.root = $('<div/>', {'class': 'row'}).append(
			$('<div/>', {'class': 'col-auto'}).append(
				$('<label/>')
			),
			$('<div/>', {'class': 'col'}).append(
				$('<input/>', {'class': 'pr-editor-form-instruction', 'type': 'text'})
			),
			$('<div/>', {'class': 'col-auto'}).append(
				$('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': 'Delete'})
			)
		);

		this.is_single = false;
		this.is_section = options.is_section;
		this._action = $.Callbacks();
		this._label = this.root.find("label").first();
		this._field = this.root.find(".pr-editor-form-instruction").first();
		this._button = this.root.find(".pr-editor-form-button").first();

		this._button.click(() => {
			this._action.fire();
		});

		this._update();
	};
	
	InstructionItem.prototype = {
		_update: function() {
			if (this.is_section) {
				this._label.html("Section:");
			}
		},
		set_label: function(value) {
			this._label.html(value);
		},
		set_single: function(value) {
			this.is_single = value;
			this._update();
		},
		action: function(cb) {
			this._action.add(cb);
		}
	};

	var InstructionList = function(root) {
		this._root = root;

		this._widgets = {
			add_instruction: $('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': 'New Instruction'}),
			add_section: $('<input/>', {'class': 'pr-editor-form-button', 'type': 'button', 'value': 'New Section'}),
		};

		this._widgets.buttons_panel = $('<div/>', {'class': 'row'}).append(
			$('<div/>', {'class': 'col'}),
			$('<div/>', {'class': 'col-auto'}).append(
				this._widgets.add_instruction,
				this._widgets.add_section
			)
		);

		this._root.append(this._widgets.buttons_panel);

		this._instructions = new DynamicList(
			this._widgets.buttons_panel,
			{
				"allow_delete_single": true
			}
		);

		this._widgets.add_instruction.click(() => this._add_instruction());
		this._widgets.add_section.click(() => this._add_section());

		this._add_instruction();
		this._update();
	};
	
	InstructionList.prototype = {
		_update: function() {
			let size = this._instructions.length();
			let step = 0;
			for (let i = 0; i < size; ++i) {
				let item = this._instructions.at(i);
				if (item.is_section) {
					step = 0;
				} else {
					step += 1;
					item.set_label(step + ".");
				}
			}
		},
		_add_instruction: function() {
			this._instructions.add(new InstructionItem({
				is_section: false
			}));
			this._update();
		},
		_add_section: function() {
			this._instructions.add(new InstructionItem({
				is_section: true
			}));
			this._update();
		},
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

	this._instructions = new InstructionList(this._widgets.instructions);
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