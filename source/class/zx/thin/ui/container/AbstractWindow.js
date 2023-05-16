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

qx.Class.define("zx.thin.ui.container.AbstractWindow", {
  extend: zx.thin.ui.container.Composite,
  type: "abstract",

  construct() {
    this.base(arguments);
    this.__mover = new zx.thin.core.Mover(this._getMoverDragElement(), this);

    this._createElements();

    this.initInline();
    this.initCentered();
    this.initMovable();
  },

  properties: {
    /** Whether the window is inline in HTML or floating */
    inline: {
      init: false,
      check: "Boolean",
      apply: "_applyInline"
    },

    /** Whether the window is modal */
    modal: {
      init: false,
      check: "Boolean",
      apply: "_applyModal"
    },

    /** Caption for the header */
    caption: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applyCaption"
    },

    /** Whether the window is kept centered */
    centered: {
      init: "none",
      check: ["none", "x", "y", "both"],
      apply: "_applyCentered"
    },

    /**
     * Whether the window is movable
     */
    movable: {
      init: false,
      check: "Boolean",
      apply: "_applyMovable"
    }
  },

  members: {
    /** @type {qx.Promise} promise which is non-null while the window is open, and resolves when closed */
    __promise: null,

    /**
     * Opens the window; the return value is a promise which does not change for multiple
     * calls, until either `close()` or `reject()` is called.
     *
     * @return {qx.Promise}
     */
    open() {
      if (!this.__promise) {
        this.__promise = new qx.Promise();
        this.__promise.then(result => (this.__promise = null));
      }
      this.show();
      return this.__promise;
    },

    /**
     * Closes the window, and rejects the promise returned by `open()`
     *
     * @param err {Error?} optional error object
     */
    reject(err) {
      if (this.__promise) {
        this.__promise.reject(err);
        this.__promise = null;
      }
      this.hide();
    },

    /**
     * Closes the window, and resolves the promise returned by `open()`
     *
     * @param result {Object?} optional result to resolve the promise to
     */
    close(result) {
      if (this.__promise) {
        this.__promise.resolve(result);
        this.__promise = null;
      }
      this.hide();
    },

    /**
     * @Override
     */
    _applyVisible(value, oldValue) {
      if (value) {
        if (!this.isInDocument()) {
          let root = qx.html.Element.getDefaultRoot();
          if (qx.core.Environment.get("qx.debug")) {
            this.assertTrue(!!root);
          }
          root.add(this);
        }
      }
      if (this.isModal()) {
        let modal = zx.thin.core.Modal.getInstance();
        if (value) modal.pushTarget(this);
        else modal.removeTarget(this);
      }
      this.base(arguments, value, oldValue);
    },

    /**
     * Called to add the elements to `this`; this should add the body and the header at the very least
     */
    _createElements() {
      throw new Error(`No implementation for ${this.classname}._createElements`);
    },

    /**
     * Called to get the element that is dragged
     *
     * @return {qx.html.Element} the element to drag
     */
    _getMoverDragElement() {
      throw new Error(`No implementation for ${this.classname}._getMoverDragElement`);
    },

    /**
     * Called to get the element that the user can add elements to
     *
     * @return {qx.html.Element} the parent for widgets
     */
    getBody() {
      return this.getQxObject("qx.window.body");
    },

    /**
     * Apply for `caption`
     */
    _applyCaption(value) {
      this.getQxObject("qx.window.caption").setText(value);
    },

    /**
     * Apply for `inline`
     */
    _applyInline(value) {
      if (value) this.addClass("qx-window-inline");
      else this.removeClass("qx-window-inline");
      this._updateMover();
    },

    _applyModal(value) {
      if (this.isVisible()) {
        let modal = zx.thin.core.Modal.getInstance();
        if (value) modal.pushTarget(this);
        else modal.removeTarget(this);
      }
    },

    /**
     * Apply for `centered`
     */
    _applyCentered(value, oldValue) {
      if (value !== "none" && oldValue === "none") {
        qx.event.Registration.addListener(window, "resize", this._onWindowResize, this);
      } else if (value === "none" && oldValue !== "none") {
        qx.event.Registration.removeListener(window, "resize", this._onWindowResize, this);
      }
      this.center(value);
    },

    /**
     * Apply for `movable`
     */
    _applyMovable(value) {
      this._updateMover();
    },

    /**
     * (Re)configures the Mover
     */
    _updateMover() {
      this.__mover.setEnabled(!this.isInline() && this.isMovable());
    },

    /**
     * Handler for resize events on the navigator `window`
     *
     * @param evt {Event}
     */
    _onWindowResize(evt) {
      if (this.getCentered() != "none") this.center(this.getCentered());
    },

    /**
     * @Override
     */
    _connectDomNode(domNode) {
      this.base(arguments, domNode);
      if (this.getCentered() != "none") {
        this.center(this.getCentered());
        setTimeout(() => this.center(this.getCentered()), 1);
      }
    },

    /**
     * Centers the window
     *
     * @param centered {String} same as the centered property, this controls how the centering is done
     */
    center(centered) {
      if (centered === undefined) centered = "both";
      if (this.isInline()) {
        if (centered == "x" || centered == "both") {
          this.setStyles({
            marginLeft: "auto",
            marginRight: "auto"
          });
        }
      } else {
        this.setStyles({
          marginLeft: null,
          marginRight: null
        });
        if (!this.canBeSeen()) return;

        let size = this.getDimensions();
        let css = {};
        if (centered == "x" || centered == "both") css.left = Math.round((qx.bom.Viewport.getWidth() - size.width) / 2);
        if (centered == "y" || centered == "both")
          css.top = Math.round((qx.bom.Viewport.getHeight() - size.height) / 2);
        this.setStyles(css);
      }
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "qx.window.caption":
          return <h1></h1>;

        case "qx.window.body":
          return <div className="qx-window-body"></div>;
      }
      return this.base(arguments, id);
    }
  }
});
