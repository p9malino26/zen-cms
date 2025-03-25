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

qx.Class.define("zx.cli.ArgvIterator", {
  extend: qx.core.Object,

  construct(argv) {
    super();
    this.__argv = argv;
  },

  members: {
    __index: 1,

    peek(peekAheadIndex = 0) {
      if (this.__argv.length > this.__index + peekAheadIndex) {
        return this.__argv[this.__index + peekAheadIndex];
      }
      return null;
    },

    skip() {
      this.__index++;
    },

    pop(peekAheadIndex = 0) {
      let value = this.peek(peekAheadIndex);
      this.skip();
      return value;
    }
  }
});
