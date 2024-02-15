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
    },

    testBooleanArrayFlag() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("boolean-array-flag-cmd");
      root.addSubcommand(sub1);
      sub1.addFlag(
        new zx.cli.Flag("boolean-array").set({
          type: "boolean",
          array: true
        })
      );

      sub1.addArgument(new zx.cli.Argument("arg-one"));
      sub1.addArgument(new zx.cli.Argument("arg-two"));
      sub1.addArgument(new zx.cli.Argument("arg-three"));

      let cmd = root.parseRoot(["xxx", "boolean-array-flag-cmd", "--boolean-array=true", "--no-boolean-array", "--boolean-array", "--boolean-array=false", "argone", "argtwo"]);
      this.assertArrayEquals([true, false, true, false], cmd.getFlag("boolean-array").getValue());
      this.assertEquals("argone", cmd.getArgument(0).getValue());
      this.assertEquals("argtwo", cmd.getArgument(1).getValue());
      this.assertNull(cmd.getArgument(2).getValue());
    },

    testIntegerArrayFlag() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("integer-array-flag-cmd");
      root.addSubcommand(sub1);
      sub1.addFlag(
        new zx.cli.Flag("integer-array").set({
          type: "integer",
          array: true
        })
      );

      sub1.addArgument(new zx.cli.Argument("arg-one"));
      sub1.addArgument(new zx.cli.Argument("arg-two"));
      sub1.addArgument(new zx.cli.Argument("arg-three"));

      let cmd = root.parseRoot(["xxx", "integer-array-flag-cmd", "--integer-array=1", "--integer-array", "2", "argone", "argtwo"]);
      this.assertArrayEquals([1, 2], cmd.getFlag("integer-array").getValue());
      this.assertEquals("argone", cmd.getArgument(0).getValue());
      this.assertEquals("argtwo", cmd.getArgument(1).getValue());
      this.assertNull(cmd.getArgument(2).getValue());
    },

    testIntegerNotArrayFlag() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("integer-not-array-flag-cmd");
      root.addSubcommand(sub1);
      sub1.addFlag(
        new zx.cli.Flag("integer").set({
          type: "integer"
        })
      );

      sub1.addArgument(new zx.cli.Argument("arg-one"));
      sub1.addArgument(new zx.cli.Argument("arg-two"));
      sub1.addArgument(new zx.cli.Argument("arg-three"));

      let cmd = root.parseRoot(["xxx", "integer-not-array-flag-cmd", "--integer=1", "argone", "argtwo"]);
      this.assertEquals(1, cmd.getFlag("integer").getValue());
      this.assertEquals("argone", cmd.getArgument(0).getValue());
      this.assertEquals("argtwo", cmd.getArgument(1).getValue());
      this.assertNull(cmd.getArgument(2).getValue());

      cmd = root.parseRoot(["xxx", "integer-not-array-flag-cmd", "--integer=1", "--integer", "2", "argone", "argtwo"]);
      this.assertEquals(2, cmd.getFlag("integer").getValue());
    },

    testArgsArray() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("args-array-cmd");
      root.addSubcommand(sub1);
      sub1.addArgument(
        new zx.cli.Argument("string-arg").set({
          type: "string",
          array: true,
          required: true
        })
      );

      let cmd = root.parseRoot(["xxx", "args-array-cmd", "argone", "argtwo"]);
      this.assertArrayEquals(["argone", "argtwo"], cmd.getArgument("string-arg").getValue());
    },

    testCaptureHyphenatedArg() {
      let root = new zx.cli.Command("*");

      let sub1 = new zx.cli.Command("capture-hypehated-arg-cmd");
      root.addSubcommand(sub1);
      sub1.addFlag(
        new zx.cli.Flag("string-flag").set({
          type: "string"
        })
      );

      sub1.addArgument(new zx.cli.Argument("arg-one"));
      sub1.addArgument(new zx.cli.Argument("arg-two"));
      sub1.addArgument(new zx.cli.Argument("arg-three"));

      let cmd = root.parseRoot(["xxx", "capture-hypehated-arg-cmd", "--string-flag", "--", "--string-flag", "argone", "argtwo"]);
      this.assertEquals("--string-flag", cmd.getFlag("string-flag").getValue());
      this.assertEquals("argone", cmd.getArgument(0).getValue());
      this.assertEquals("argtwo", cmd.getArgument(1).getValue());
      this.assertNull(cmd.getArgument(2).getValue());
    }
  }
});
