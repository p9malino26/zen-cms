const readline = require("readline");

/**
 * Helper class to buffer multiple streams, parse the IO into complete lines and call a
 * callback for each line.
 *
 * This needs to be closed to release the buffered streams.
 */
qx.Class.define("zx.utils.BufferedIoStreams", {
  extend: qx.core.Object,

  construct(cb, ...streams) {
    super();
    this.__cb = cb;
    this.__streams = [];
    if (streams) {
      this.add(...streams);
    }
  },

  members: {
    __cb: null,
    __streams: null,

    add(...streams) {
      streams.forEach(stream => {
        let rlStream = readline.createInterface({
          input: stream,
          crlfDelay: Infinity
        });
        rlStream.on("line", this.__cb);
        this.__streams.push(rlStream);
      });
    },

    close() {
      this.__streams.forEach(rlStream => {
        rlStream.close();
      });
      this.__streams = [];
    }
  }
});
