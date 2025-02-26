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

qx.Class.define("zx.cli.commands.WorkCommand", {
  extend: zx.cli.Command,

  construct() {
    super("work");
    this.set({
      description: "Utility commands for operating workers"
    });
    this.addSubcommand(new zx.cli.commands.work.StartDockerPoolCommand());
    this.addSubcommand(new zx.cli.commands.work.StartWorkerCommand());
  }
});
