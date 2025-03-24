qx.Class.define("zx.reports.datasource.AbstractDataSource", {
  extend: qx.core.Object,

  members: {
    /** @type{String} the position, one of [ "before-start", "on-row", "at-eof", "beyond-eof" ] */
    __position: null,

    /**
     * Opens the data source and advances to the first row
     */
    async open() {
      if (this.__position !== null) {
        throw new Error("Cannot open a DataSource more than once");
      }
      this.__position = "before-start";
      await this._openImpl();
      await this.next();
    },

    /**
     * Closes the data source
     */
    close() {
      if (this.__position === null) {
        throw new Error("Cannot close a DataSource more than once");
      }
      this._closeImpl();
      this.__position = null;
    },

    /**
     * Moves to the next row
     */
    async next() {
      if (this.__position == "beyond-eof") {
        throw new Error(`Beyond EOF in report ${this}`);
      }

      if (this.__position == "at-eof") {
        this.__position = "beyond-eof";
        return;
      }

      if (!(await this._nextImpl())) {
        this.__position = "at-eof";
      } else {
        this.__position = "on-row";
      }
    },

    /**
     * Tests whether at EOF or not
     *
     * @returns {Boolean}
     */
    isAtEof() {
      return this.__position == "at-eof" || this.__position == "beyond-eof";
    },

    /**
     * Called to implement open
     */
    async _openImpl() {
      // Nothing
    },

    /**
     * Called to implement close
     */
    _closeImpl() {
      // Nothing
    },

    /**
     * Implements the switch to the next row
     *
     * @return {Boolean} true if there was a new row
     */
    async _nextImpl() {
      throw new Error(`No such implementation for ${this.classname}._nextImpl`);
    },

    /**
     * Returns a value for the column
     *
     * @param {String} columnName
     */
    get(columnName) {
      throw new Error(`No such implementation for ${this.classname}.get`);
    },

    /**
     * Returns a list of all column names
     *
     * @return {String[]}
     */
    getColumnNames() {
      throw new Error(`No such implementation for ${this.classname}.get`);
    }
  }
});
