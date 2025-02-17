qx.Class.define("zx.demo.server.work.ErrorWork", {
  extend: zx.server.work.AbstractWork,

  members: {
    /**
     * @override
     */
    async execute(log) {
      log("I'm about to throw an exception!");
      throw new Error("oops");
    }
  }
});
