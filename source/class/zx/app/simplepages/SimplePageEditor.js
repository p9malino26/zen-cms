qx.Class.define("zx.app.simplepages.SimplePageEditor", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    super();
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("tabview"));
  },

  members: {
    _createQxObjectImpl(id) {
      switch (id) {
        case "tabview":
          var tv = new qx.ui.tabview.TabView();
          tv.add(this.getQxObject("pgDetails"));
          tv.add(this.getQxObject("pgHtml"));
          return tv;

        case "pgDetails":
          var pg = new qx.ui.tabview.Page("Details");
          this._addField(pg, new qx.ui.form.TextField(), "Page Title", "title");
          this._addField(pg, new qx.ui.form.TextField(), "URL", "url");
          this._addField(pg, new qx.ui.form.TextField(), "Layout", "layout");
          this._addField(pg, new qx.ui.form.TextField(), "CSS Class", "cssClass");
          return pg;
      }
    }
  }
});
