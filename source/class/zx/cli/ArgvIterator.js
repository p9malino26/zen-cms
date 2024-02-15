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
      this.__index += peekAheadIndex + 1;
      if (this.__index > this.__argv.length) {
        return null;
      }
      return this.__argv[this.__index];
    }
  }
});
