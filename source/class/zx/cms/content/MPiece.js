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

qx.Mixin.define("zx.cms.content.MPiece", {
  members: {
    /**
     * Get the class used to edit properties in the control panel; this is the mini editor,
     * so it's expected to be physically compact and edit the most frequently used properties.
     *
     * @see `getFullEditorClass`
     *
     * @returns {Class<zx.ui.editor.Editor>?} the editor, null if not editable
     */
    getMiniEditorClass() {
      return zx.cms.content.PieceMiniEditor;
    },

    /**
     * Get the class used to edit all the properties in the control panel; this is the full
     * editor, so it would normally be shown in a popup dialog or large screen area.  All
     * properties should be editable
     *
     * @see `getMiniEditorClass`
     *
     * @returns {Class<zx.ui.editor.Editor>?} the editor, null if not editable
     */
    getFullEditorClass() {
      return null;
    },

    /**
     * A description suitable for the layout tree
     *
     * @returns {String}
     */
    describeForLayoutTree() {
      let classname = this.classname;
      let pos = classname.lastIndexOf(".");
      classname = classname.substring(pos + 1);
      return classname;
    }
  }
});
