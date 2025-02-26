qx.Class.define("zx.demo.server.work.ErrorWork", {
  extend: qx.core.Object,
  implement: zx.server.work.IWork,

  members: {
    /**
     * @override
     */
    async execute(workResult) {
      workResult.appendWorkLog("I'm about to throw an exception!");
      throw new Error("oops");
    }
  }
});
