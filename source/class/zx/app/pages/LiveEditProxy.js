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

qx.Class.define("zx.app.pages.LiveEditProxy", {
  extend: zx.io.persistence.Object,
  "@": [zx.io.remote.anno.Class.NOPROXY],

  construct(pageEditor) {
    this.base(arguments);
    this.__pageEditor = pageEditor;
  },

  members: {
    /**
     * Called to tell the remote that a property has changed
     */
    "@liveEdited": zx.io.remote.anno.Method.DEFAULT,
    liveEdited(pieceUuid, propertyName, value) {
      this.__pageEditor.liveEdited(pieceUuid, propertyName, value);
    }
  }
});
