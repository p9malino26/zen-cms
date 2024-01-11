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
