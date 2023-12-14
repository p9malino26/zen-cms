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

qx.Class.define("zx.test.thin.DemoHelloWindowFeature", {
  extend: zx.cms.content.SimpleFeature,

  members: {
    /**
     * @Override
     */
    renderClientInstaller(rendering, options) {
      return `
(function() {
  var domClone = piece.uniqueDiv.children[0].cloneNode(true);
  var obj = new ${this._targetClass.classname}();
  obj.useNode(piece.uniqueDiv.children[0]);
  obj.setRoot(true);
  obj.runUseNodeTests(domClone);
})();
`;
    }
  }
});
