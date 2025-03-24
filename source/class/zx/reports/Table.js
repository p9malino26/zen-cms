qx.Class.define("zx.reports.Table", {
  extend: zx.reports.Group,
  implement: [zx.reports.IHasColumns],

  construct(columns, row) {
    super();
    if (columns) {
      this.setColumns(columns);
    }
    this.setChild(row || new zx.reports.TableRow());
  },

  properties: {
    columns: {
      check: "Array"
    }
  },

  members: {
    /**
     * @override
     */
    async _executeImpl(ds, result) {
      let tbody = <tbody></tbody>;

      let row = this.getChild();
      while (!ds.isAtEof()) {
        await row.execute(ds, tbody);
      }

      result.add(
        <table>
          <thead>
            <tr>
              {this.getColumns().map(column => (
                <th>{column.getHeaderValue(ds, this)}</th>
              ))}
            </tr>
          </thead>
          {tbody}
        </table>
      );
    }
  }
});
