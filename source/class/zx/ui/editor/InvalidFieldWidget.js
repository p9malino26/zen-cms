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

qx.Class.define("zx.ui.editor.InvalidFieldWidget", {
  extend: qx.ui.basic.Atom,

  // We have to have IForm and MForm so that the tooltip manager will recognise the `valid` and `invalidMessage` properties
  implement: [qx.ui.form.IForm],
  include: [qx.ui.form.MForm],

  construct(label, icon) {
    super(label || "Field is not valid", icon || "@FontAwesomeSolid/exclamation-circle/16");

    this.addListener("pointerover", this._onPointerOver);
    this.addListener("pointerout", this._onPointerOut);
  },

  properties: {
    appearance: {
      init: "invalid-field",
      refine: true
    },

    /** The widget that this widget is showing the valid/invalid status for */
    fieldWidget: {
      init: null,
      nullable: true,
      check: "qx.ui.core.Widget",
      apply: "_applyFieldWidget"
    }
  },

  members: {
    /**
     * Apply for `fieldWidget`
     */
    _applyFieldWidget(value, oldValue) {
      if (oldValue) {
        oldValue.removeListener("changeValid", this.__onChangeValid, this);
        oldValue.removeListener("changeInvalidMessage", this.__onChangeInvalidMesssage, this);

        this.set({ valid: true, invalidMessage: null });
      }
      if (value) {
        value.addListener("changeValid", this.__onChangeValid, this);
        value.addListener("changeInvalidMessage", this.__onChangeInvalidMesssage, this);

        this.set({
          valid: value.getValid(),
          invalidMessage: value.getInvalidMessage(),
          label: value.getInvalidMessage()
        });
      }
    },

    /**
     * Event handler for the fieldWidget's `valid` property
     * @param {*} evt
     */
    __onChangeValid(evt) {
      this.setValid(evt.getData());
    },

    /**
     * Event handler for the fieldWidget's `invalidMessage` property
     * @param {*} evt
     */
    __onChangeInvalidMesssage(evt) {
      this.setInvalidMessage(evt.getData());
      this.setLabel(evt.getData());
    },

    /**
     * Listener method for "pointerover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param evt {qx.event.type.Pointer} Mouse event
     */
    _onPointerOver(evt) {
      if (!this.isEnabled() || evt.getTarget() !== this) {
        return;
      }

      this.addState("hovered");
    },

    /**
     * Listener method for "pointerout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param evt {qx.event.type.Pointer} Mouse event
     */
    _onPointerOut(evt) {
      if (!this.isEnabled() || evt.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");
    }
  }
});
