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

qx.Class.define("zx.reports.table.TableColumn", {
  extend: qx.core.Object,

  construct(caption, columnName, format) {
    super();
    if (caption) {
      this.setCaption(caption);
    }
    if (columnName) {
      this.setColumnName(columnName);
    }
    if (format) {
      this.setFormat(format);
    }
  },

  properties: {
    caption: {
      check: "String"
    },

    columnName: {
      check: "String"
    },

    format: {
      init: null,
      nullable: true,
      check: "Object"
    }
  },

  members: {
    getDisplayValue(ds, table) {
      let value = ds.get(this.getColumnName());
      value = this.formatValue(value);
      return value;
    },

    getHeaderValue(ds, table) {
      return this.getCaption() || this.getColumnName();
    },

    /**
     * Formats the value
     *
     * @param {*} value
     * @returns {String}
     */
    formatValue(value) {
      if (value === null) {
        return "";
      }
      let format = this.getFormat();
      if (format) {
        if (format instanceof qx.util.format.DateFormat) {
          if (!qx.lang.Type.isDate(value)) {
            return "Invalid Date";
          }
          return format.format(value);
        }

        if (format instanceof qx.util.format.NumberFormat) {
          if (!qx.lang.Type.isNumber(value)) {
            try {
              value = parseFloat(value);
            } catch (ex) {
              return "Invalid number";
            }
          }
          return format.format(value);
        }

        if (typeof format == "function") {
          return format(value);
        }

        this.error("Unrecognised type of format for column " + this.getCaption());
      }

      return "" + value;
    }
  }
});
