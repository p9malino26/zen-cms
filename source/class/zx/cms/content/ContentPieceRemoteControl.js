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

qx.Class.define("zx.cms.content.ContentPieceRemoteControl", {
  extend: zx.cms.content.AbstractRemoteControl,

  members: {
    /**
     * @Override
     */
    initialise() {
      let ed = zx.cms.content.ContentPieceRemoteControl.__initialiseEditor();
      ed.addElements(this.getElements());
    },

    /**
     * @Override
     */
    _onEditableInput(uuid, html) {
      this.__liveEditProxy.liveEdited(uuid, "content", html);
    },

    /**
     * @Override
     */
    propertyChanged(propertyName, value, oldValue) {
      let div = this.getElements()[0] || null;

      switch (propertyName) {
        case "content":
          value = value || "";
          if (div.innerHTML != value) {
            div.innerHTML = value;
          }
          break;

        case "cssClass":
          this._changeCssClass(value, oldValue);
          return;

        default:
          return super.propertyChanged(propertyName, value, oldValue);
      }
    }
  },

  statics: {
    /**
     * Initialises the editor if needed
     *
     * @ignore(MediumEditor)
     * @returns MediumEditor
     */
    __initialiseEditor() {
      const CPRC = zx.cms.content.ContentPieceRemoteControl;
      if (CPRC.__editor) {
        return CPRC.__editor;
      }
      let ed = (CPRC.__editor = new MediumEditor([], {
        buttonLabels: "fontawesome"
      }));

      ed.subscribe("editableInput", (eventObj, div) => {
        let editable = qx.core.Init.getApplication().findEditable(div);
        if (!editable) {
          throw new Error(`Cannot find editable for 'editableInput' div`);
        }
        editable.remoteControl._onEditableInput(editable.uuid, div.innerHTML);
      });

      return CPRC.__editor;
    }
  }
});
