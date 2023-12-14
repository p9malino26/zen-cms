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

qx.Class.define("zx.test.io.remote.RemoteThinXhrFeature", {
  extend: zx.thin.ui.container.Window,
  implement: [zx.cms.content.IFeatureClientLifecycle],

  construct() {
    super();
    this.setCaption("Demo");
    let body = this.getBody();
    body.add(<h2>This is a thin client, using Xhr to the server</h2>);
    body.add(
      <p>
        This thin client should be able to see changes made by the Desktop-based demo runner; the demo runner will perform tests and watch the console output of this iframe to check that the updates
        happen
      </p>
    );

    body.add(<p>Unlike the zx.test.io.remote.DemoRemoteWindows, both the Desktop and the thin client are independently talking to the server via Xhr and not using postMessage between windows</p>);

    this.setCentered("both");
    this.setStyles({
      width: 600
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

    _createQxObjectImpl(id) {
      switch (id) {
        case "btnChangeAge":
          var btn = new zx.thin.ui.form.Button("Change Age");
          btn.addListener("execute", async () => {
            let grandad = this._grandad;
            this.info(`Button is setting grandad's age to ${grandad.getAge() + 1}`);

            grandad.setAge(grandad.getAge() + 1);
            let controller = await qx.core.Init.getApplication().getNetController();
            controller.flush();
          });
          return btn;

        case "btnAddChild":
          var btn = new zx.thin.ui.form.Button("Add Child");
          btn.addListener("execute", async () => {
            let grandad = this._grandad;
            let newChild = new zx.test.io.remote.Person("Child_No_" + (grandad.getChildren().getLength() + 1));

            this.info(`Button is adding child ${newChild.getName()}`);
            grandad.getChildren().push(newChild);
            grandad.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            let controller = await qx.core.Init.getApplication().getNetController();
            controller.flush();
          });
          return btn;

        case "btnAddGrandchild":
          var btn = new zx.thin.ui.form.Button("Add Grandchild");
          btn.addListener("execute", async () => {
            let grandad = this._grandad;
            let beverly = this._beverly;
            let newChild = new zx.test.io.remote.Person("Beverly_Child_No_" + (beverly.getChildren().getLength() + 1));

            this.info(`Button is adding grandchild ${newChild.getName()}`);
            beverly.getChildren().push(newChild);
            beverly.getChildren().forEach(child => {
              if (child !== newChild) {
                child.getSiblings().push(newChild);
                newChild.getSiblings().push(child);
              }
            });
            let controller = await qx.core.Init.getApplication().getNetController();
            controller.flush();
          });
          return btn;

        case "btnRemoveGrandchild":
          var btn = new zx.thin.ui.form.Button("Remove Grandchild");
          btn.addListener("execute", async () => {
            let grandad = this._grandad;
            let beverly = this._beverly;
            if (!beverly.getChildren().getLength()) {
              this.info(`Beverly has no more children to remove`);
              return;
            }
            let oldChild = beverly.getChildren().getItem(0);
            this.info(`Button is removing grandchild ${oldChild.getName()}`);
            beverly.getChildren().remove(oldChild);
            beverly.getChildren().forEach(child => child.getSiblings().remove(oldChild));
            oldChild.getSiblings().removeAll();
            let controller = await qx.core.Init.getApplication().getNetController();
            controller.flush();
          });
          return btn;
      }

      return super._createQxObjectImpl(id);
    },

    /**
     * @Override
     */
    onReady(options) {
      this._onReady(options);
    },

    async _onReady(options) {
      let controller = await qx.core.Init.getApplication().getNetController();

      let grandad = (this._grandad = controller.getUriMapping("zx.test.io.remote.RemoteXhrServer.grandad"));

      let beverly = (this._beverly = grandad.getChildren().getItem(0));

      grandad.addListener("changeAge", evt => {
        this.info(`Grandad's age changed to ${evt.getData()}`);
      });

      const traverse = person => {
        person.getChildren().addListener("change", evt => {
          let data = evt.getData();
          (data.removed || []).forEach(item => this.info(person.getName() + ": removed child " + item.getName()));

          (data.added || []).forEach(item => {
            this.info(person.getName() + ": added child " + item.getName());
            traverse(item);
          });
        });
        person.getChildren().forEach(traverse);
      };
      traverse(grandad);

      this.info(`onReady complete`);

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
