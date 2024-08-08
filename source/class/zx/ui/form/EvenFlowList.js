/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */
/**
 * A list of items which are displayed in an evenly-spaced flow layout (zx.ui.layout.evenflow.EvenFlowLayout)
 * Items are selectable and can be added and removed dynamically.
 *
 * N.B. This currenly only works when the list items are all the same width!
 */
qx.Class.define("zx.ui.form.EvenFlowList", {
  extend: qx.ui.core.scroll.AbstractScrollArea,
  implement: [qx.ui.core.IMultiSelection, qx.ui.form.IForm, qx.ui.form.IField, qx.ui.form.IModelSelection],

  include: [qx.ui.core.MRemoteChildrenHandling, qx.ui.core.MMultiSelectionHandling, qx.ui.form.MForm, qx.ui.form.MModelSelection],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct() {
    super();

    // Create content
    this.__content = this._createListItemContainer();
    this.__content.setLayout(new zx.ui.layout.evenflow.EvenFlowLayout());

    // Used to fire item add/remove events
    this.__content.addListener("addChildWidget", this._onAddChild, this);
    this.__content.addListener("removeChildWidget", this._onRemoveChild, this);

    // Add to scrollpane
    this.getChildControl("pane").add(this.__content);

    // Add keypress listener
    this.addListener("keypress", this._onKeyPress);
    this.addListener("keyinput", this._onKeyInput);

    // initialize the search string
    this.__pressedString = "";
    this.__childrenBindings = new Map();
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events: {
    /**
     * This event is fired after a list item was added to the list. The
     * {@link qx.event.type.Data#getData} method of the event returns the
     * added item.
     */
    addItem: "qx.event.type.Data",

    /**
     * This event is fired after a list item has been removed from the list.
     * The {@link qx.event.type.Data#getData} method of the event returns the
     * removed item.
     */
    removeItem: "qx.event.type.Data"
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties: {
    // overridden
    appearance: {
      refine: true,
      init: "list"
    },

    // overridden
    focusable: {
      refine: true,
      init: true
    },

    // overridden
    width: {
      refine: true,
      init: 100
    },

    // overridden
    height: {
      refine: true,
      init: 200
    },

    /**
      @readonly
      Have to set this in order to make keyboard navigation work
     */
    orientation: {
      init: "horizontal"
    },

    /** Spacing between the items */
    spacing: {
      check: "Integer",
      init: 0,
      apply: "_applySpacing",
      themeable: true
    },

    /** Controls whether the inline-find feature is activated or not */
    enableInlineFind: {
      check: "Boolean",
      init: true
    },

    /** Whether the list is read only when enabled */
    readOnly: {
      check: "Boolean",
      init: false,
      event: "changeReadOnly",
      apply: "_applyReadOnly"
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members: {
    __pressedString: null,
    __lastKeyPress: null,

    /** @type {qx.ui.core.Widget} The children container */
    __content: null,

    /** @type {Class} Pointer to the selection manager to use */
    SELECTION_MANAGER: qx.ui.core.selection.ScrollArea,

    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    getChildrenContainer() {
      return this.__content;
    },

    __childrenBindings: null,
    /**
     * Handle child widget adds on the content pane
     *
     * @param e {qx.event.type.Data} the event instance
     */
    _onAddChild(e) {
      const child = e.getData();
      if (qx.Class.implementsInterface(child, qx.ui.form.IListItem)) {
        this.__childrenBindings.set(child.toHashCode(), this.bind("readOnly", child, "readOnly"));
      }

      this.fireDataEvent("addItem", child);
    },

    /**
     * Handle child widget removes on the content pane
     *
     * @param e {qx.event.type.Data} the event instance
     */
    _onRemoveChild(e) {
      const child = e.getData();
      const binding = this.__childrenBindings.get(child.toHashCode());
      if (binding) {
        child.removeBinding(binding);
        this.__childrenBindings.delete(child.toHashCode());
      }
      this.fireDataEvent("removeItem", child);
    },

    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Used to route external <code>keypress</code> events to the list
     * handling (in fact the manager of the list)
     *
     * @param e {qx.event.type.KeySequence} KeyPress event
     */
    handleKeyPress(e) {
      if (!this._onKeyPress(e)) {
        this._getManager().handleKeyPress(e);
      }
    },

    /*
    ---------------------------------------------------------------------------
      PROTECTED API
    ---------------------------------------------------------------------------
    */

    /**
     * This container holds the list item widgets.
     *
     * @return {qx.ui.container.Composite} Container for the list item widgets
     */
    _createListItemContainer() {
      return new qx.ui.container.Composite();
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applySpacing(value, old) {
      this.__content.getLayout().setSpacing(value);
    },

    // property readOnly
    _applyReadOnly(value) {
      this._getManager().setReadOnly(value);
      if (value) {
        this.addState("readonly");
        this.addState("disabled");

        // Remove draggable
        if (this.isDraggable()) {
          this._applyDraggable(false, true);
        }

        // Remove droppable
        if (this.isDroppable()) {
          this._applyDroppable(false, true);
        }
      } else {
        this.removeState("readonly");

        if (this.isEnabled()) {
          this.removeState("disabled");

          // Re-add draggable
          if (this.isDraggable()) {
            this._applyDraggable(true, false);
          }

          // Re-add droppable
          if (this.isDroppable()) {
            this._applyDroppable(true, false);
          }
        }
      }
    },

    // override
    _applyEnabled(value, old) {
      super._applyEnabled(value, old);

      // If editable has just been turned on, we need to correct for readOnly status
      if (value && this.isReadOnly()) {
        this.addState("disabled");

        // Remove draggable
        if (this.isDraggable()) {
          this._applyDraggable(false, true);
        }

        // Remove droppable
        if (this.isDroppable()) {
          this._applyDroppable(false, true);
        }
      }
    },

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for <code>keypress</code> events.
     *
     * @param e {qx.event.type.KeySequence} KeyPress event
     * @return {Boolean} Whether the event was processed
     */
    _onKeyPress(e) {
      // Execute action on press <ENTER>
      if (e.getKeyIdentifier() == "Enter" && !e.isAltPressed()) {
        var items = this.getSelection();
        for (var i = 0; i < items.length; i++) {
          items[i].fireEvent("action");
        }

        return true;
      }

      return false;
    },

    /*
    ---------------------------------------------------------------------------
      FIND SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Handles the inline find - if enabled
     *
     * @param e {qx.event.type.KeyInput} key input event
     */
    _onKeyInput(e) {
      // do nothing if the find is disabled
      if (!this.getEnableInlineFind()) {
        return;
      }

      // Only useful in single or one selection mode
      var mode = this.getSelectionMode();
      if (!(mode === "single" || mode === "one")) {
        return;
      }

      // Reset string after a second of non pressed key
      if (new Date().valueOf() - this.__lastKeyPress > 1000) {
        this.__pressedString = "";
      }

      // Combine keys the user pressed to a string
      this.__pressedString += e.getChar();

      // Find matching item
      var matchedItem = this.findItemByLabelFuzzy(this.__pressedString);

      // if an item was found, select it
      if (matchedItem) {
        this.setSelection([matchedItem]);
      }

      // Store timestamp
      this.__lastKeyPress = new Date().valueOf();
    },

    /**
     * Takes the given string and tries to find a ListItem
     * which starts with this string. The search is not case sensitive and the
     * first found ListItem will be returned. If there could not be found any
     * qualifying list item, null will be returned.
     *
     * @param search {String} The text with which the label of the ListItem should start with
     * @return {qx.ui.form.ListItem} The found ListItem or null
     */
    findItemByLabelFuzzy(search) {
      // lower case search text
      search = search.toLowerCase();

      // get all items of the list
      var items = this.getChildren();

      // go threw all items
      for (var i = 0, l = items.length; i < l; i++) {
        // get the label of the current item
        var currentLabel = items[i].getLabel();

        // if the label fits with the search text (ignore case, begins with)
        if (currentLabel && currentLabel.toLowerCase().indexOf(search) == 0) {
          // just return the first found element
          return items[i];
        }
      }

      // if no element was found, return null
      return null;
    },

    /**
     * Find an item by its {@link qx.ui.basic.Atom#getLabel}.
     *
     * @param search {String} A label or any item
     * @param ignoreCase {Boolean?true} description
     * @return {qx.ui.form.ListItem} The found ListItem or null
     */
    findItem(search, ignoreCase) {
      // lowercase search
      if (ignoreCase !== false) {
        search = search.toLowerCase();
      }

      // get all items of the list
      var items = this.getChildren();
      var item;

      // go through all items
      for (var i = 0, l = items.length; i < l; i++) {
        item = items[i];

        // get the content of the label; text content when rich
        var label;

        if (item.isRich()) {
          var control = item.getChildControl("label", true);
          if (control) {
            var labelNode = control.getContentElement().getDomElement();
            if (labelNode) {
              label = qx.bom.element.Attribute.get(labelNode, "text");
            }
          }
        } else {
          label = item.getLabel();
        }

        if (label != null) {
          if (label.translate) {
            label = label.translate();
          }
          if (ignoreCase !== false) {
            label = label.toLowerCase();
          }

          if (label.toString() == search.toString()) {
            return item;
          }
        }
      }

      return null;
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct() {
    this._disposeObjects("__content");
  }
});
