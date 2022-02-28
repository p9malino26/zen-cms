/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Class.define("zx.app.demo.DemonstratorProxy", {
  extend: zx.io.persistence.Object,

  construct(targetObject) {
    this.base(arguments);
    this.__targetObject = targetObject;
  },

  members: {
    __targetObject: null,

    "@getTestNames": zx.io.remote.anno.Method.DEFAULT,
    async getTestNames() {
      let names = Object.keys(this.__targetObject.constructor.prototype).filter(
        name =>
          name.length > 4 &&
          name.startsWith("test") &&
          name[4] === name[4].toUpperCase()
      );
      this.info("getTestNames called, returning " + names.join(","));
      return names;
    },

    "@runTest": zx.io.remote.anno.Method.DEFAULT,
    async runTest(name) {
      this.info(`runTest("${name}") called`);
      let result = new zx.app.demo.TestResult().set({
        testClassname: this.classname,
        testName: name
      });

      try {
        result.log("Starting test");
        if (typeof this.__targetObject.setUp == "function") {
          result.setPhase("setUp");
          await this.__targetObject.setUp(result);
        }

        result.setPhase("test");
        await this.__targetObject[name](result);

        if (typeof this.__targetObject.tearDown == "function") {
          result.setPhase("tearDown");
          await this.__targetObject.tearDown(result);
        }

        result.set({ status: "ok", phase: null });
        result.log("Test complete");
      } catch (ex) {
        result.log("Exception occured: " + ex.stack || ex);
        result.set({ status: "failed", phase: null });
      }

      return {
        testClassname: result.getTestClassname(),
        testName: result.getTestName(),
        status: result.getStatus(),
        phase: result.getPhase(),
        log: result.getLog()
      };
    }
  }
});
