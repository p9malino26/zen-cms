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

qx.Class.define("zx.test.io.remote.DemoRemoteWindows", {
  extend: zx.app.demo.Demonstrator,

  construct() {
    this.base(arguments);
    this._captureLogs(this.__url);
  },

  members: {
    __url: "/tests/io/remote/demo-thin-peer-two.html",

    /**
     * @Override
     */
    _createUiRoot() {
      return this.getQxObject("root");
    },

    /**
     * @Override
     *
     * TODO This is false because there is something in controller or datasource that breaks
     * if we dispose and re-create it - but that should be fixed so that reset is allowed
     */
    _supportsReset: false,

    /**
     * @Override
     */
    _supportsEmbeddedUnitTests: true,

    /**
     * @Override
     */
    async resetDemo() {
      await this.base(arguments);

      let iframe = this.getQxObject("root");
      iframe.setSource("");
      iframe.setSource(this.__url);
      this.log("Reloaded " + iframe.getSource());

      this.initialise();
    },

    async testProxyUnitTestNames() {
      let names = await this.getTestNames();
      this.assertTrue(names.indexOf("testSayHello") > -1);
    },

    /**
     * @Override
     */
    initialise() {
      this.base(arguments);

      let ctlr = this.getWindowIoController();

      this._grandad = new zx.test.io.remote.Person("Arthur").set({ age: 47 });
      ctlr.putUriMapping("grandad", this._grandad);

      this._debbie = new zx.test.io.remote.Person("Debbie");
      this._clarice = new zx.test.io.remote.Person("Clarice");
      this._beverly = new zx.test.io.remote.Person("Beverly");

      this._beverly.getChildren().push(this._clarice);
      this._beverly.getChildren().push(this._debbie);
      this._clarice.getSiblings().push(this._debbie);
      this._debbie.getSiblings().push(this._clarice);
      this._grandad.getChildren().push(this._beverly);

      this._grandad.addListener("changeAge", evt => {
        this.log(`Grandad's age changed to ${evt.getData()}`);
      });
      const traverse = person => {
        person.getChildren().addListener("change", evt => {
          let data = evt.getData();
          (data.removed || []).forEach(item =>
            this.log(person.getName() + ": removed child " + item.getName())
          );
          (data.added || []).forEach(item => {
            this.log(person.getName() + ": added child " + item.getName());
            traverse(item);
          });
        });
        person.getChildren().forEach(traverse);
      };
      traverse(this._grandad);
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "root":
          var iframe = new qx.ui.embed.Iframe(this.__url);
          this.log("Page source is " + this.__url);
          return iframe;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnChangeAge"));
          tb.add(this.getQxObject("btnAddChild"));
          tb.add(this.getQxObject("btnAddGrandChild"));
          tb.add(this.getQxObject("btnRemoveGrandChild"));
          return tb;

        case "btnChangeAge":
          var btn = new qx.ui.toolbar.Button("Change Age");
          btn.addListener("execute", () => {
            var grandad = this._grandad;
            this.log(
              `btnChangeAge is setting grandad's age to ${grandad.getAge() + 1}`
            );
            grandad.setAge(grandad.getAge() + 1);
            this.getWindowIoController().flush();
          });
          return btn;

        case "btnAddChild":
          var btn = new qx.ui.toolbar.Button("Add Child");
          btn.addListener("execute", () => {
            var grandad = this._grandad;
            let newChild = new zx.test.io.remote.Person(
              "Child_No_" + (grandad.getChildren().getLength() + 1)
            );
            this.log(`btnAddChild is adding child ${newChild.getName()}`);
            grandad.getChildren().push(newChild);
            grandad.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            this.getWindowIoController().flush();
          });
          return btn;

        case "btnAddGrandChild":
          var btn = new qx.ui.toolbar.Button("Add Grandchild");
          btn.addListener("execute", () => {
            var grandad = this._grandad;
            var beverly = this._beverly;
            let newChild = new zx.test.io.remote.Person(
              "Beverly_Child_No_" + (beverly.getChildren().getLength() + 1)
            );
            this.log(`Button is adding grandchild ${newChild.getName()}`);
            beverly.getChildren().push(newChild);
            beverly.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            this.getWindowIoController().flush();
          });

        case "btnRemoveGrandChild":
          var btn = new qx.ui.toolbar.Button("Remove Grandchild");
          btn.addListener("execute", () => {
            var grandad = this._grandad;
            var beverly = this._beverly;
            if (!beverly.getChildren().getLength()) {
              this.log(`Beverly has no more children to remove`);
              return;
            }
            let oldChild = beverly.getChildren().getItem(0);
            this.log(`Button is removing grandchild ${oldChild.getName()}`);
            beverly.getChildren().remove(oldChild);
            beverly
              .getChildren()
              .forEach(child => child.getSiblings().remove(oldChild));
            oldChild.getSiblings().removeAll();
            this.getWindowIoController().flush();
          });
      }
      return this.base(arguments, id);
    }
  }
});
