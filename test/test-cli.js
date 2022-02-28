const test = require("tape");
const fs = require("fs");
const qx = require("@qooxdoo/framework");
const testUtils = require("./utils");
const fsPromises = testUtils.fsPromises;

if (process.argv.find(v => v == "--debug")) testUtils.DEBUG = true;

test("create site", async assert => {
  try {
    await testUtils.deleteRecursive("myWebApp");
    let result = await testUtils.runCommand(
      ".",
      "qx",
      "create",
      "myWebApp",
      "-I"
    );
    assert.ok(result.exitCode === 0);
    let compileJson = await testUtils.readJson("myWebApp/compile.json");
    compileJson.libraries = [".", "../.."];
    await testUtils.writeJson("myWebApp/compile.json", compileJson);

    await testUtils.runCommand("myWebApp", "qx", "cms", "install");
    assert.ok(fs.existsSync("myWebApp/cms.json"));

    await testUtils.runCommand(
      "myWebApp",
      "qx",
      "cms",
      "create-theme",
      "myweb.WebTheme"
    );
    assert.ok(
      fs.existsSync("myWebApp/website/_cms/themes/myweb.WebTheme/theme.scss")
    );
    assert.ok(
      fs.existsSync(
        "myWebApp/website/_cms/themes/myweb.WebTheme/global/page-layout-base.html"
      )
    );
    await testUtils.runCommand(
      "myWebApp",
      "qx",
      "cms",
      "create-page",
      "sample-styles.html",
      "'Sample Styles'"
    );
    let json = await testUtils.readJson(
      "myWebApp/website/_cms/db/template/pages/sample-styles.json"
    );
    assert.ok(json && json.title == "Sample Styles");

    assert.end();
  } catch (ex) {
    assert.end(ex);
  }
});
