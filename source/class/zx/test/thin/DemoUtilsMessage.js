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


qx.Class.define("zx.test.thin.DemoUtilsMessage", {
  extend: zx.thin.ui.container.Window,

  construct() {
    this.base(arguments);
    this.setCaption("Demo Popup");
    let body = this.getBody();
    body.add(<h2>Demo of creating windows on the fly</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("btnAlert"));
    row.add(this.getQxObject("btnConfirm"));
    row.add(this.getQxObject("btnWorking"));
    this.setCentered("both");
    this.setStyles({
      width: 400
    });
  },

  properties: {
    inline: {
      init: true,
      refine: true
    }
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "btnAlert":
          var btn = new zx.thin.ui.form.Button("Alert").set({
            buttonStyle: "contained"
          });
          btn.addListener("execute", async () => {
            await zx.thin.ui.utils.Alert.show(
              "This is an alert!",
              "Alert Caption"
            );
            this.info("Alert Done");
          });
          return btn;

        case "btnConfirm":
          var btn = new zx.thin.ui.form.Button("Confirm").set({
            buttonStyle: "contained"
          });
          btn.addListener("execute", async () => {
            let result = await zx.thin.ui.utils.Confirm.show(
              "This is a choice",
              "Choice Caption"
            );
            this.info("Result was " + result);
          });
          return btn;

        case "btnWorking":
          var btn = new zx.thin.ui.form.Button("Working").set({
            buttonStyle: "contained"
          });
          btn.addListener("execute", () => {
            let dlg = zx.thin.ui.utils.WorkInProgress.getInstance();
            let fns = [
              () => dlg.addTask("Task One"),
              () =>
                dlg.addTask(
                  "Lorem ipsum dolor sit amet, consectetur adipiscing"
                ),
              () => dlg.removeTask(dlg.getTasks().getItem(0)),
              () => dlg.getTasks().getItem(0).setComplete(true)
            ];
            const tick = () => {
              let fn = fns.shift();
              fn();
              if (fns.length) setTimeout(tick, 1000);
            };
            tick();
          });
          return btn;
      }
      return this.base(arguments, id);
    }
  }
});
