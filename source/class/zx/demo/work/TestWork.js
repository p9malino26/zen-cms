qx.Class.define("zx.demo.work.TestWork", {
  extend: zx.server.work.AbstractWork,

  members: {
    /**
     * @override
     */
    async execute(log) {
      console.log("the task is running!");
      log("Hello, World!");
      log("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");

      for (let i = 0; i < 10; i++) {
        log(`Doing thing ${i}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // TODO: anything!
      return "success!";
    }
  }
});
