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
 * Computes Fletcher 32.  Based almost verbatim on https://github.com/gavr-pavel/fletcher32.js
 */
qx.Class.define("zx.utils.Fletcher32", {
  extend: qx.core.Object,

  construct() {
    super();
    this._sum1 = 0xffff;
    this._sum2 = 0xffff;
  },

  members: {
    append(data) {
      // data should be an array of 16-bit numbers
      var words = data.length;
      var dataIndex = 0;
      while (words) {
        var tlen = words > 359 ? 359 : words;
        words -= tlen;
        do {
          this._sum2 += this._sum1 += data[dataIndex++];
        } while (--tlen);

        this._sum1 = ((this._sum1 & 0xffff) >>> 0) + (this._sum1 >>> 16);
        this._sum2 = ((this._sum2 & 0xffff) >>> 0) + (this._sum2 >>> 16);
      }
    },

    result() {
      this._sum1 = ((this._sum1 & 0xffff) >>> 0) + (this._sum1 >>> 16);
      this._sum2 = ((this._sum2 & 0xffff) >>> 0) + (this._sum2 >>> 16);
      return (((this._sum2 << 16) >>> 0) | this._sum1) >>> 0;
    }
  }
});
