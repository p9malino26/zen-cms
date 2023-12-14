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

qx.Class.define("zx.ui.utils.EditorDialog", {
  extend: zx.ui.utils.AbstractDialog,

  construct(editor, caption) {
    super(caption);
    this.setLayout(new qx.ui.layout.VBox());
    this.bind("value", editor, "value");
    this.bind("editor.value", this, "value");

    if (editor) {
      this.setEditor(editor);
    }
    this.add(this.getQxObject("buttonBar"));
  },

  properties: {
    editor: {
      init: null,
      nullable: true,
      check: "zx.ui.editor.FormEditor",
      event: "changeEditor",
      apply: "_applyEditor"
    }
  },

  members: {
    /**
     * Apply for `editor`
     */
    _applyEditor(value, oldValue) {
      if (oldValue) {
        this.remove(oldValue);
        oldValue.removeListener("changeValid", this.__onEditorChangeValid, this);
      }
      if (value) {
        this.add(value);
        value.addListener("changeValid", this.__onEditorChangeValid, this);
      }
    },

    /**
     * Event handler for the editor's `valid` property
     */
    __onEditorChangeValid(evt) {
      let valid = evt.getData();
      this.getButtons().forEach(code => {
        let data = this._getButtonType(code);
        if (!data || data.kind == "submit") {
          let btn = this.getDialogButton(code);
          btn.setEnabled(valid);
        }
      });
    },

    /**
     * @Override
     */
    _onOpened() {
      let editor = this.getEditor();
      editor.validate();
    },

    /**
     * Helper to reset the editor form
     */
    reset() {
      this.getEditor().reset();
    },

    /**
     * @Override
     */
    async submitDialog(buttonCode) {
      let editor = this.getEditor();
      await editor.validate();
      if (!editor.isValid()) {
        zx.ui.utils.MessageDlg.showError("Please correct the errors on the form");

        return false;
      }
      return await super.submitDialog(buttonCode);
    }
  }
});
