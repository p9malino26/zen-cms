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

qx.Class.define("zx.reports.server.Cursor", {
  extend: zx.server.Object,
  "@": zx.io.remote.anno.Class.DEFAULT,

  construct(mongoCursor) {
    super();
    this.__mongoCursor = mongoCursor;
  },

  members: {
    /**
     * Returns the number of documents
     */
    "@estimatedDocumentCount": zx.io.remote.anno.Method.DEFAULT,
    async estimatedDocumentCount() {
      return await this.__mongoCursor.estimatedDocumentCount();
    },

    /**
     * Returns the next document, or null of there are no more
     *
     * @return {Object}
     */
    "@next": zx.io.remote.anno.Method.DEFAULT,
    async next() {
      try {
        let result = await this.__mongoCursor.next();
        return result;
      } catch (e) {
        console.warn(e);
        return null;
      }
    }
  }
});
