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
 * Default controller for ContainerPiece.
 */
qx.Class.define("zx.cms.content.ContainerPieceController", {
  extend: zx.cms.render.Controller,

  members: {
    /**
     * @Override
     */
    getTemplateName(piece) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(piece instanceof zx.cms.content.ContainerPiece);
      }
      return piece.getLayout() || "index";
    }
  }
});
