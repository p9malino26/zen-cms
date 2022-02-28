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
 * Default controller for pieces.  Selects a template with the special name "default"
 */
qx.Class.define("zx.cms.content.PieceController", {
  extend: zx.cms.render.Controller,

  members: {
    /**
     * @Override
     */
    getTemplateName(piece) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(piece instanceof zx.cms.content.Piece);
      }
      return "index";
    }
  }
});
