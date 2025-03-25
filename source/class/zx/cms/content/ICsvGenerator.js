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

qx.Interface.define("zx.cms.content.ICsvGenerator", {
  members: {
    /**
     * Generates the CSV content.
     *
     * @param {Object<String,String>} query The query parameters.
     * @return {Promise<String>} The CSV content.
     */
    async generateCsv(query) {}
  }
});
