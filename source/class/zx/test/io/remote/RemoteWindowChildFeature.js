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


qx.Class.define("zx.test.io.remote.RemoteWindowChildFeature", {
  extend: zx.thin.ui.container.Window,
  implement: [zx.cms.content.IFeatureClientLifecycle],

  construct() {
    this.base(arguments);
    this.setCaption("Peer Two - Demo of I/O with embedded window");
    let body = this.getBody();
    body.add(<h2>Demo zx.io.remote in embedded window</h2>);
    let row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("btnChangeAge"));
    row = <div></div>;
    body.add(row);
    row.add(this.getQxObject("btnAddChild"));
    row.add(this.getQxObject("btnAddGrandchild"));
    row.add(this.getQxObject("btnRemoveGrandchild"));
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
    _grandad: null,
    _beverly: null,
    _controller: null,

    _createQxObjectImpl(id) {
      switch (id) {
        case "btnChangeAge":
          var btn = new zx.thin.ui.form.Button("Change Age");
          btn.addListener("execute", () => {
            let grandad = this._grandad;
            this.info(
              `Button is setting grandad's age to ${grandad.getAge() + 1}`
            );
            grandad.setAge(grandad.getAge() + 1);
            this._controller.flush();
          });
          return btn;

        case "btnAddChild":
          var btn = new zx.thin.ui.form.Button("Add Child");
          btn.addListener("execute", () => {
            let grandad = this._grandad;
            let newChild = new zx.test.io.remote.Person(
              "Child_No_" + (grandad.getChildren().getLength() + 1)
            );
            this.info(`Button is adding child ${newChild.getName()}`);
            grandad.getChildren().push(newChild);
            grandad.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            this._controller.flush();
          });
          return btn;

        case "btnAddGrandchild":
          var btn = new zx.thin.ui.form.Button("Add Grandchild");
          btn.addListener("execute", () => {
            let grandad = this._grandad;
            let beverly = this._beverly;
            let newChild = new zx.test.io.remote.Person(
              "Beverly_Child_No_" + (beverly.getChildren().getLength() + 1)
            );
            this.info(`Button is adding grandchild ${newChild.getName()}`);
            beverly.getChildren().push(newChild);
            beverly.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            this._controller.flush();
          });
          return btn;

        case "btnRemoveGrandchild":
          var btn = new zx.thin.ui.form.Button("Remove Grandchild");
          btn.addListener("execute", () => {
            let grandad = this._grandad;
            let beverly = this._beverly;
            if (!beverly.getChildren().getLength()) {
              this.info(`Beverly has no more children to remove`);
              return;
            }
            let oldChild = beverly.getChildren().getItem(0);
            this.info(`Button is removing grandchild ${oldChild.getName()}`);
            beverly.getChildren().remove(oldChild);
            beverly
              .getChildren()
              .forEach(child => child.getSiblings().remove(oldChild));
            oldChild.getSiblings().removeAll();
            this._controller.flush();
          });
          return btn;
      }
      return this.base(arguments, id);
    },

    async testSayHello(result) {
      result.log(`Hello from the ${this.classname}.testSayHello`);
      return "Hello";
    },

    /**
     * @Override
     */
    onReady(options) {
      this._onReady(options);
    },

    async _onReady(options) {
      // Controller manages the objects and their serialisation
      let ctlr = (this._controller = new zx.io.remote.NetworkController());

      // Connect to the parent window because we know that we are in an iframe created by PeerOne
      let endpoint = new zx.io.remote.WindowEndpoint(window.parent);
      ctlr.addEndpoint(endpoint);
      await endpoint.open();

      let proxy = new zx.app.demo.DemonstratorProxy(this);
      ctlr.putUriMapping("zx.app.demo.DemonstratorProxy", proxy);

      let grandad = (this._grandad = ctlr.getUriMapping("grandad"));
      let beverly = (this._beverly = grandad.getChildren().getItem(0));

      grandad.addListener("changeAge", evt => {
        this.info(`Grandad's age changed to ${evt.getData()}`);
      });

      const traverse = person => {
        person.getChildren().addListener("change", evt => {
          let data = evt.getData();
          (data.removed || []).forEach(item =>
            this.info(person.getName() + ": removed child " + item.getName())
          );
          (data.added || []).forEach(item => {
            this.info(person.getName() + ": added child " + item.getName());
            traverse(item);
          });
        });
        person.getChildren().forEach(traverse);
      };
      traverse(grandad);

      let A = qx.core.Assert;

      A.assertTrue(!!grandad);
      A.assertEquals("Arthur", grandad.getName());
      A.assertEquals(1, grandad.getChildren().getLength());
      beverly = grandad.getChildren().getItem(0);
      A.assertEquals("Beverly", beverly.getName());
      A.assertEquals(2, beverly.getChildren().getLength());
      let clarice = beverly.getChildren().getItem(0);
      let debbie = beverly.getChildren().getItem(1);
      A.assertEquals("Clarice", clarice.getName());
      A.assertEquals("Debbie", debbie.getName());
      A.assertEquals(1, clarice.getSiblings().getLength());
      A.assertEquals(1, debbie.getSiblings().getLength());
      A.assertTrue(clarice.getSiblings().getItem(0) === debbie);
      A.assertTrue(debbie.getSiblings().getItem(0) === clarice);
    }
  }
});
