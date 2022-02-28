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

qx.Theme.define("zx.ui.editor.MAppearance", {
  appearances: {
    "invalid-field": {
      include: "atom",
      style(states) {
        return {
          textColor: "text-on-error",
          backgroundColor: "error",
          padding: [0, 4],
          font: "small"
        };
      }
    }
  }
});
