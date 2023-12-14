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
 * @usefont(FontAwesome)
 * @usefont(FontAwesomeBrands)
 * @usefont(FontAwesomeSolid)
 * @usefont(Montserrat)
 * @use(zx.cms.content.ContentPiece)
 * @use(zx.test.thin.DemoButtons)
 */
qx.Class.define("zx.test.TestsAppServer", {
  extend: zx.server.WebServer
});
