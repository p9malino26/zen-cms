qx.Class.define("zx.reports.Report", {
  extend: zx.reports.Group,

  construct(child) {
    super();
    if (child) {
      this.setChild(child);
    }
  }
});
