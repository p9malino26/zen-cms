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

qx.Class.define("zx.app.pages.UrlTreeEditor", {
  extend: zx.ui.editor.Editor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox());
    this._add(this.getQxObject("toolbar"));
    this._add(this.getQxObject("tree"));
  },

  properties: {
    currentNode: {
      init: null,
      nullable: true,
      check: "zx.app.pages.UrlNode",
      event: "changeCurrentNode",
      apply: "_applyCurrentNode"
    }
  },

  members: {
    _applyCurrentNode(value) {
      this.getQxObject("tree")
        .getSelection()
        .replace(value ? [value] : []);
      this.getQxObject("btnDelete").setEnabled(!!value);
    },

    _createQxObjectImpl(id) {
      switch (id) {
        case "header":
          var row = new zx.ui.tree.Row().set({
            header: true,
            controller: this.getQxObject("view")
          });
          return row;

        case "ctlr":
          var ctlr = new zx.ui.tree.controller.Controller(null);
          ctlr.setOptions({
            getChildrenPath: function () {
              return "children";
            }
          });
          this.bind("value.rootNode", ctlr, "model");
          return ctlr;

        case "view":
          var view = new zx.ui.tree.column.View();
          zx.app.pages.UrlTreeEditor.COLUMNS.forEach(column =>
            view.getColumns().push(column)
          );
          return view;

        case "tree":
          var tree = new zx.ui.tree.Tree().set({
            view: this.getQxObject("view"),
            model: this.getQxObject("ctlr"),
            decorator: "main",
            width: 200,
            draggable: true,
            droppable: true
          });
          tree.setLayoutProperties({ flex: 1 });
          tree.getSelection().addListener(
            "change",
            function (evt) {
              var sel = evt.getTarget();
              this.setCurrentNode(sel.getLength() ? sel.getItem(0) : null);
            },
            this
          );
          return tree;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnAdd"));
          tb.add(this.getQxObject("btnDelete"));
          return tb;

        case "btnAdd":
          var btn = new qx.ui.toolbar.Button(
            "Create",
            "@FontAwesome/plus-square/16"
          );
          btn.addListener("execute", () => {
            let node = new zx.app.pages.UrlNode();
            let parent =
              this.getCurrentNode() || this.getQxObject("ctlr").getModel();
            node.setName("part-" + (parent.getChildren().getLength() + 1));
            node.setParent(parent);
            parent.getChildren().push(node);
          });
          return btn;

        case "btnDelete":
          var btn = new qx.ui.toolbar.Button(
            "Delete",
            "@FontAwesome/times-circle/16"
          ).set({ enabled: false });
          return btn;
      }
    }
  },

  statics: {
    COLUMNS: [new zx.ui.tree.column.TextColumn("Name", "name", 125)]
  }
});
