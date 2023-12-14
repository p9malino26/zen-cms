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

qx.Class.define("zx.cms.website.ShortUrl", {
  extend: zx.server.Object,

  properties: {
    /** The URL that this is associated with */
    url: {
      check: "String",
      event: "changeUrl",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The unique short code */
    shortCode: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeShortCode",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Optional descriptive title */
    title: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Type or action, controls how this URL is interpretter */
    type: {
      init: "impersonate",
      check: ["redirect", "impersonate"],
      event: "changeType",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Optional data stored with the short url, probably JSON as a string */
    value: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeValue",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    /**
     * Makes sure that there is a short code allocated
     */
    async allocateShortCode() {
      if (this.getShortCode()) {
        return;
      }
      let shortened = null;
      let pass = 0;
      let server = zx.server.Standalone.getInstance();
      let url = this.getUrl();
      while (true) {
        let shortened = zx.cms.website.ShortUrl.shorten(url, pass);
        let data = await server.getDb().findOne(zx.cms.website.ShortUrl, {
          _classname: "zx.cms.website.ShortUrl",
          shortCode: shortened
        });

        if (!data) {
          this.setShortCode(shortened);
          await this.save();
          return;
        }
        pass++;
      }
    }
  },

  statics: {
    __DICT: "abcdefghijklmnopqrstuvwxyz0123456789",

    /**
     * Loads a ShortUrl by looking up the short code
     *
     * @param {String} shortCode
     * @returns {zx.cms.website.ShortUrl}
     */
    async getShortUrlByShortCode(shortCode) {
      let server = zx.server.Standalone.getInstance();
      let shortUrl = await server.findOneObjectByType(zx.cms.website.ShortUrl, {
        shortCode: shortCode
      });

      return shortUrl;
    },

    /**
     * Shortens a string
     *
     * @param {String} str the string to shorten
     * @param {Integer?} index optional pass/index to append to the string first
     * @returns {String} the short code
     */
    shorten(str, index) {
      const util = require("util");
      let encoder = new util.TextEncoder("utf-8");
      if (index) {
        str += zx.cms.website.ShortUrl.__intToString(index);
      }
      let bytes = encoder.encode(str);
      let fletcher = new zx.utils.Fletcher32();
      fletcher.append(bytes);
      let result = fletcher.result();
      let shortened = zx.cms.website.ShortUrl.__intToString(result);
      return shortened;
    },

    /**
     * Internal method to convert a number to a string based on a 36 character dictionary
     *
     * @param {Integer} srcValue
     * @returns {String} encoded value
     */
    __intToString(srcValue) {
      let result = "";

      // Make sure that negative numbers are converted bitwise unsigned
      let value = srcValue & 0x7fffffff;

      // encode
      const DICT = zx.cms.website.ShortUrl.__DICT;
      let dictLength = DICT.length;
      while (value != 0) {
        let remainder = Math.floor(Math.abs(value % dictLength));
        result += DICT[remainder];
        value = Math.floor(value / dictLength);
      }
      return result;
    }
  }
});
