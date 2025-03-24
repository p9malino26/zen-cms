/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Mixin.define("zx.server.files.MDataFile", {
  members: {
    /**
     * Returns a URL to access the asset
     *
     * @returns {String}
     */
    getUrl() {
      return "/zx/blobs/" + this.toUuid() + (this.getExtension() || "");
    }
  }
});
