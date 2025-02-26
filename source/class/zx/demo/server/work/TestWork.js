qx.Class.define("zx.demo.server.work.TestWork", {
  implement: zx.server.work.IWork,
  extend: qx.core.Object,

  /**
   *
   * @param {integer} iterations
   */
  construct(iterations = 3) {
    super();
    this.__iterations = iterations;
  },

  members: {
    /**
     * @override
     */
    async execute(workResult) {
      console.log("the task is running!");
      workResult.appendWorkLog("Hello, World!");
      workResult.appendWorkLog("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");

      for (let i = 0; i < this.__iterations; i++) {
        workResult.appendWorkLog(`${this.toUuid().split("-")[0]} Doing thing ${i}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // TODO: anything!
      return "success!";
    }
  }
});
