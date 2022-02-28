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

qx.Class.define("zx.app.demo.ThinDemonstrator", {
  extend: zx.app.demo.Demonstrator,

  construct(url) {
    this.base(arguments);
    this.__url = url;
    let segs = url.split("/");
    if (!segs[0].length) qx.lang.Array.removeAt(segs, 0);
    let filename = segs[segs.length - 1];
    let pos = filename.indexOf(".");
    if (pos > -1) segs[segs.length - 1] = filename.substring(0, pos);
    this.setName(segs.join("."));
    this._captureLogs(this.__url);
  },

  members: {
    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    /**
     * @Override
     */
    _supportsReset: true,

    /**
     * @Override
     */
    async resetDemo() {
      let iframe = this.getQxObject("root");
      iframe.setSource("");
      iframe.setSource(this.__url);
      this.log("Reloaded " + this.__url);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var iframe = new qx.ui.embed.Iframe(this.__url);
          this.log("Page source is " + this.__url);
          return iframe;
      }
      return this.base(arguments, id);
    }
  }
});
