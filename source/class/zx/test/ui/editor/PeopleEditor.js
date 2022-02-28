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

qx.Class.define("zx.test.ui.editor.PeopleEditor", {
  extend: zx.ui.editor.Editor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    this._add(this.getQxObject("toolbar"));
    this._add(this.getQxObject("root"));
    this._add(this.getQxObject("compStatus"));
    this.bind("value", this.getQxObject("ctlr"), "model");
  },

  properties: {
    currentPerson: {
      init: null,
      nullable: true,
      check: "zx.test.io.remote.Person",
      event: "changeCurrentPerson",
      apply: "_applyCurrentPerson"
    }
  },

  members: {
    _applyCurrentPerson(value) {
      this.getQxObject("ctlr")
        .getSelection()
        .replace(value ? [value] : []);
      this.getQxObject("edPerson").set({
        value: value,
        visibility: value ? "visible" : "excluded"
      });
      this.getQxObject("btnDelete").setEnabled(!!value);
    },

    _saveValueImpl() {
      this.getQxObject("edPerson").save();
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnAdd"));
          tb.add(this.getQxObject("btnDelete"));
          return tb;

        case "btnAdd":
          var btn = new qx.ui.toolbar.Button("Add Person");
          btn.addListener("execute", () => {
            let model = this.getQxObject("ctlr").getModel();
            model.push(
              new zx.test.io.remote.Person().set({
                name: "Person #" + (model.getLength() + 1),
                age: model.getLength() + 20
              })
            );
          });
          return btn;

        case "btnDelete":
          var btn = new qx.ui.toolbar.Button("Delete Person").set({
            enabled: false
          });
          btn.addListener("execute", () => {
            let model = this.getQxObject("ctlr").getModel();
            model.remove(this.getCurrentPerson());
          });
          return btn;

        case "root":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(2));
          comp.add(this.getQxObject("lst"));
          comp.add(this.getQxObject("edPerson"));
          return comp;

        case "lst":
          return new qx.ui.form.List();

        case "ctlr":
          var ctlr = new qx.data.controller.List(
            null,
            this.getQxObject("lst"),
            "name"
          );
          ctlr.addListener("changeSelection", evt => {
            let sel = ctlr.getSelection();
            let item = sel.getLength() ? sel.getItem(0) : null;
            this.setCurrentPerson(item);
          });
          return ctlr;

        case "edPerson":
          var ed = new zx.test.ui.editor.PersonEditor().set({
            visibility: "excluded"
          });
          ed.bind("modified", this, "modified");
          ed.addListener("changeModified", evt => {
            this.info("Person editor detected modified=" + evt.getData());
          });
          return ed;

        case "compStatus":
          var comp = new qx.ui.container.Composite().set({
            visibility: "hidden",
            layout: new qx.ui.layout.VBox()
          });
          comp.add(this.getQxObject("lblStatus"));
          this.getQxObject("edPerson").addListener("changeValid", evt => {
            let valid = evt.getData();
            comp.setVisibility(valid ? "hidden" : "visible");
          });
          return comp;

        case "lblStatus":
          var lbl = new qx.ui.basic.Label("Form is not valid").set({
            allowGrowX: true
          });
          return lbl;
      }
    }
  }
});
