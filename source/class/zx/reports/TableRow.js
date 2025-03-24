qx.Class.define("zx.reports.TableRow", {
  extend: zx.reports.Block,

  members: {
    /**
     * Finds the nearest parent table
     *
     * @returns {zx.reports.Table?}
     */
    getTable() {
      for (let tmp = this.getParent(); tmp; tmp = tmp.getParent()) {
        if (tmp instanceof zx.reports.Table) {
          return tmp;
        }
      }
      throw new Error("Cannot find table");
    },

    /**
     * Returns the columns of the nearest table, or from this if it is overridden
     *
     * @returns {zx.reports.TableColumn[]}
     */
    getEffectiveColumns() {
      for (let tmp = this.getParent(); tmp; tmp = tmp.getParent()) {
        if (qx.Interface.classImplements(tmp.constructor, zx.reports.IHasColumns)) {
          return tmp.getColumns();
        }
      }
      throw new Error("Cannot find columns");
    },

    /**
     * @override
     */
    async _executeImpl(ds, result) {
      let tr = <tr></tr>;

      let table = this.getTable();
      this.getEffectiveColumns().forEach(column => {
        tr.add(<td>{column ? column.getDisplayValue(ds, table) : "&nbsp;"}</td>);
      });

      result.add(tr);
      await ds.next();
    }
  }
});
