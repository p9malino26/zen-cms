qx.Class.define("zx.demo.server.work.TestWork", {
  implement: zx.server.work.IWork,
  extend: qx.core.Object,

  /**
   *
   * @param {integer} iterations
   */
  construct(iterations = 10) {
    super();
    this.__iterations = iterations;
  },

  members: {
    /**
     * @override
     */
    async execute(log) {
      console.log("the task is running!");
      log("Hello, World!");
      log("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");

      for (let i = 0; i < this.__iterations; i++) {
        log(`${this.toUuid().split("-")[0]} Doing thing ${i}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // TODO: anything!
      return "success!";
    }
  }
});
