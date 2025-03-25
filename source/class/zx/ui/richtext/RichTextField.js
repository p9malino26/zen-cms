/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

qx.Class.define("zx.ui.richtext.RichTextField", {
  extend: qx.ui.core.Widget,
  implement: [qx.ui.form.IStringForm, qx.ui.form.IForm],
  include: [qx.ui.form.MForm],

  /**
   * Constructor
   */
  construct() {
    super();
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("tabview"));
  },

  properties: {
    value: {
      init: null,
      nullable: true,
      event: "changeValue",
      check: "String",
      apply: "_applyValue"
    }
  },

  members: {
    _applyValue(value, oldValue) {
      this.getQxObject("edtContent").setValue(value || "");
      this.getQxObject("edtHtml").setValue(value || "");
    },

    /*
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "tabview":
          var tv = new qx.ui.tabview.TabView();
          tv.setLayoutProperties({ flex: 1 });
          tv.add(this.getQxObject("pageContent"));
          tv.add(this.getQxObject("pageHtml"));
          return tv;

        case "pageContent":
          var pg = new qx.ui.tabview.Page("Content");
          pg.setLayout(new qx.ui.layout.Grow());
          pg.add(this.getQxObject("edtContent"));
          return pg;

        case "edtContent":
          var edt = new zx.ui.richtext.Medium();
          edt.setLayoutProperties({ flex: 1 });
          edt.addListener("changeValue", evt => this.setValue(evt.getData()));
          return edt;

        case "pageHtml":
          var pg = new qx.ui.tabview.Page("HTML");
          pg.setLayout(new qx.ui.layout.VBox());
          pg.add(this.getQxObject("toolbar"));
          pg.add(this.getQxObject("edtHtml"), { flex: 1 });
          return pg;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnBeautify"));
          return tb;

        case "btnBeautify":
          var btn = new qx.ui.form.Button("Beautify");
          btn.addListener("execute", evt => {
            var html = this.getValue();
            if (html) {
              html = zx.ui.richtext.Beautify.beautifyHtml(html);
              this.setValue(html);
            }
          });

          return btn;

        case "edtHtml":
          var edt = new zx.ui.richtext.CodeMirror("eclipse").set({ mode: "htmlembedded" });
          edt.setLayoutProperties({ flex: 1 });
          edt.addListener("changeValue", evt => this.setValue(evt.getData()));
          return edt;
      }

      return super._createQxObjectImpl(id);
    }
  }
});
