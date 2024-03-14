const path = require("path");
const fs = require("fs");

qx.Class.define("zx.utils.Files", {
  extend: qx.core.Object,

  statics: {
    /**
     * Makes the parent directory of the given filename
     *
     * @param {String} filename
     */
    async makeParentDir(filename) {
      let dir = path.dirname(filename);
      await fs.promises.mkdir(dir, { recursive: true });
    },

    /**
     * Makes the directory
     *
     * @param {String} filename
     */
    async makeDir(dir) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
});
