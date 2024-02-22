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
