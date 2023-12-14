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

qx.Class.define("zx.test.cli.TestCli", {
  extend: qx.dev.unit.TestCase,

  members: {
    testParsing() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("hello");
      root.addSubcommand(sub1);
      sub1.addFlag(
        new zx.cli.Flag("flag-one").set({
          shortCode: "o",
          type: "string"
        })
      );

      let sub2 = new zx.cli.Command("world");
      sub1.addSubcommand(sub2);
      sub2.addFlag(
        new zx.cli.Flag("integer").set({
          type: "integer",
          required: true
        })
      );

      sub2.addArgument(new zx.cli.Argument("arg-one"));
      sub2.addArgument(
        new zx.cli.Argument("arg-array").set({
          array: true
        })
      );

      let cmd = root.parseRoot(["xxx", "hello", "--flag-one=alpha", "world", "--integer", "4", "five", "six", "seven"]);

      this.assertTrue(cmd.getName() == "world");
      this.assertTrue(cmd.getParent().getFlag("flagOne").getValue() == "alpha");
      this.assertTrue(cmd.getFlag("integer").getValue() === 4);
      this.assertTrue(cmd.getArgument(0).getValue() === "five");
      let arr = cmd.getArgument(1).getValue();
      this.assertTrue(arr.length == 2);
      this.assertTrue(arr[0] === "six");
      this.assertTrue(arr[1] === "seven");

      cmd = root.parseRoot(["xxx", "hello", "world", "--", "--integer", "4", "five", "six", "seven"]);

      this.assertTrue(cmd.getName() == "world");
      this.assertTrue(cmd.getArgument(0).getValue() === "--integer");
      arr = cmd.getArgument(1).getValue();
      this.assertTrue(arr.length == 4);
      this.assertTrue(arr[0] === "4");
      this.assertTrue(arr[1] === "five");
      this.assertTrue(arr[2] === "six");
      this.assertTrue(arr[3] === "seven");
      console.log(cmd.usage());
      console.log(root.usage());
    }
  }
});
