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


qx.Class.define("zx.app.demo.TestResultListItem", {
  extend: qx.ui.form.ListItem,

  members: {
    /**
     * @Override
     */
    _applyModel(value, oldValue) {
      if (oldValue) {
        oldValue.removeListener("changeStatus", this.__updateUi, this);
      }
      if (value) {
        value.addListener("changeStatus", this.__updateUi, this);
      }
      this.__updateUi();
    },

    /**
     * Updates the display
     */
    __updateUi() {
      let model = this.getModel();
      if (!model) {
        this.set({ label: "(no test result" });
        return;
      }
      let str = model.getTestName();
      if (!str) str = "All of " + model.getTestClassname();
      else str = model.getTestClassname() + "." + str;
      let status = model.getStatus();
      if (status == "ok") {
        this.set({
          icon: "@FontAwesomeSolid/thumbs-up/16",
          label: "    ok: " + str
        });
      } else if (status == "failed") {
        this.set({
          icon: "@FontAwesomeSolid/thumbs-down/16",
          label: "not ok: " + str
        });
      } else {
        this.set({ icon: "@FontAwesomeSolid/slash/16", label: str });
      }
    }
  }
});
