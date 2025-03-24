/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Class.define("zx.cli.commands.DemoCommand", {
  extend: zx.cli.Command,

  construct() {
    super("demo", "Utility commands for running demos");
    this.addSubcommand(new zx.cli.commands.demo.WorkerPoolsCommand());
  }
});
