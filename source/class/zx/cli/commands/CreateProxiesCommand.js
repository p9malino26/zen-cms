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

const fs = require("fs");

qx.Class.define("zx.cli.commands.CreateProxiesCommand", {
  extend: qx.core.Object,

  construct(compilerTargetPath, proxiesOutputPath, classToWrite) {
    this.base(arguments);
    this.__compilerTargetPath = compilerTargetPath;
    this.__proxiesOutputPath = proxiesOutputPath;
    this.__classToWrite = classToWrite;
  },

  members: {
    __compilerTargetPath: null,
    __proxiesOutputPath: null,
    __classToWrite: null,

    async run() {
      let proxiesOutputPath = this.__proxiesOutputPath;
      let compilerTargetPath = this.__compilerTargetPath;
      if (!proxiesOutputPath || !compilerTargetPath) {
        let data = await fs.promises.readFile("cms.json", "utf8");
        data = JSON.parse(data);
        if (!proxiesOutputPath) proxiesOutputPath = data.createProxies?.outputPath;
        if (!compilerTargetPath) compilerTargetPath = data.createProxies?.compilerTargetPath;
      }
      let ctlr = new zx.io.remote.proxy.ClassesWriter().set({
        outputPath: proxiesOutputPath,
        compilerTargetPath: compilerTargetPath,
        verbose: true
      });
      if (this.__classToWrite) {
        await ctlr.writeProxiedClassesFor(this.__classToWrite);
      } else {
        await ctlr.writeAllProxiedClasses();
      }
    }
  },

  statics: {
    createCliCommand() {
      let cmd = new zx.cli.Command("create-proxies").set({
        description: "Creates the proxies",
        run: async function () {
          const { arguments, flags } = this.getValues();
          let cmd = new zx.cli.commands.CreateProxiesCommand(flags["compiler-target-dir"], flags["output-dir"], flags["classname"]);
          return await cmd.run();
        }
      });

      cmd.addFlag(
        new zx.cli.Flag("compiler-target-dir").set({
          shortCode: "t",
          description: "The compiler target to read",
          type: "string"
        })
      );
      cmd.addFlag(
        new zx.cli.Flag("output-dir").set({
          shortCode: "o",
          description: "The directory to output code into",
          type: "string"
        })
      );
      cmd.addFlag(
        new zx.cli.Flag("classname").set({
          shortCode: "c",
          description: "Only write a specific class",
          type: "string"
        })
      );

      return cmd;
    }
  }
});
