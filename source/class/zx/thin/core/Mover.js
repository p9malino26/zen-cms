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
 * Handles drag moving of elements, eg a zx.thin.ui.Window will use an instance of this to make
 * itself movable via the mouse
 */
qx.Class.define("zx.thin.core.Mover", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param dragElement {qx.html.Element} the element that is clicked and dragged
   * @param moveElement {qx.html.Element?} the element that is moved, defaults to dragElement
   */
  construct(dragElement, moveElement) {
    this.base(arguments);
    this.__dragElement = dragElement;
    this.__moveElement = moveElement || dragElement;

    dragElement.addListener("pointerdown", this._onMovePointerDown, this);
    dragElement.addListener("pointerup", this._onMovePointerUp, this);
    dragElement.addListener("pointermove", this._onMovePointerMove, this);
    dragElement.addListener("losecapture", this.__onMoveLoseCapture, this);
  },

  properties: {
    /** Whether moving is enabled; if currently moving and this is set to false, the move will halt */
    enabled: {
      init: true,
      check: "Boolean",
      apply: "_applyEnabled"
    }
  },

  members: {
    /** @type {qx.html.Element} the element that the user drags */
    __dragElement: null,

    /** @type {qx.html.Element} the element that is moved (eg the window outer) */
    __moveElement: null,

    /** @type {Object} data that tracks the move, null if not moving */
    __capturing: null,

    /**
     * Apply method for enabled property
     */
    _applyEnabled(value) {
      if (!value) this.__endMoving();
    },

    /**
     * Event handler for pointer down - starts the whole drag/move process
     *
     * @param evt {qx.event.type.Pointer}
     */
    _onMovePointerDown(evt) {
      this.__mouseDown = true;
    },

    /**
     * Event handler for pointer up - ends the whole drag/move process
     *
     * @param evt {qx.event.type.Pointer}
     */
    _onMovePointerUp(evt) {
      this.__mouseDown = false;
      this.__endMoving();
    },

    /**
     * Event handler for pointer move
     *
     * @param evt {qx.event.type.Pointer}
     */
    _onMovePointerMove(evt) {
      if (!this.isEnabled()) return;

      // Don't start moving until we see an actual drag
      if (this.__mouseDown && !this.__capturing) {
        this.__startMoving(evt);
      }
      if (!this.__capturing) {
        return;
      }

      let left = evt.getDocumentLeft() - this.__capturing.pointer.left;
      let top = evt.getDocumentTop() - this.__capturing.pointer.top;
      this.__moveElement.setStyles({
        left: this.__capturing.element.left + left,
        top: this.__capturing.element.top + top
      });
      evt.preventDefault();
    },

    /**
     * Event handler for capturing being stopped (in case something else took over)
     *
     * @param evt {qx.event.type.Pointer}
     */
    __onMoveLoseCapture(evt) {
      this.__endMoving();
    },

    /**
     * Starts moving
     *
     * @param evt {qx.event.type.Pointer}
     */
    __startMoving(evt) {
      this.__dragElement.capture();
      let dom = this.__moveElement.getDomElement();
      this.__capturing = {
        pointer: {
          top: evt.getDocumentTop(),
          left: evt.getDocumentLeft()
        },
        element: {
          left: dom.offsetLeft,
          top: dom.offsetTop
        },
        cursor: this.__dragElement.getStyle("cursor")
      };
      this.__dragElement.setStyle("cursor", "grab");
    },

    /**
     * Stops the drag/move process
     */
    __endMoving() {
      if (this.__capturing) {
        this.__dragElement.releaseCapture();
        this.__dragElement.setStyle("cursor", this.__capturing.cursor);
        this.__capturing = null;
      }
    }
  }
});
