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

/**
 * A Block outputs a horizontal chunk of data, including the output of any before and after blocks
 *
 */
qx.Class.define("zx.reports.Block", {
  extend: qx.core.Object,
  type: "abstract",

  properties: {
    /** Optional parent block - do not set this manually */
    parent: {
      init: null,
      nullable: true,
      check: "zx.reports.Block"
    },

    /** Block executed before the content */
    before: {
      init: null,
      nullable: true,
      check: "zx.reports.Block"
    },

    /** Block executed after the content */
    after: {
      init: null,
      nullable: true,
      check: "zx.reports.Block"
    }
  },

  members: {
    /**
     * Creates the output
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds the datasource
     * @return {qx.html.Element} the content
     */
    async execute(ds, result) {
      if (!result) {
        result = <div></div>;
      }

      await this._before(ds, result);
      await this._executeImpl(ds, result);
      await this._after(ds, result);

      return result;
    },

    /**
     * Called to create the body of the content
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds the datasource
     * @param {qx.html.Element} result where to append any content
     */
    async _executeImpl(ds, result) {
      throw new Error(`No such implementation for ${this.classname}._executeImpl`);
    },

    /**
     * Gets an accumulator with a given ID
     *
     * @param {String} id
     * @returns
     */
    getAccumulator(id) {
      let parent = this.getParent();
      return parent ? parent.getAccumulator() : null;
    },

    /**
     * Helper method that renders a block, depending on what it is.  Does nothing if block is null
     *
     * @param {zx.reports.Block|qx.html.Element?} block the block to render
     * @param {zx.reports.datasource.AbstractDataSource} ds the datasource
     * @param {qx.html.Element} result where to append the rendered data
     */
    async _render(block, ds, result) {
      if (!block) {
        return;
      }

      if (block instanceof qx.html.Node) {
        result.add(block);
      } else if (block instanceof zx.reports.Block) {
        let html = await block.execute(ds);
        result.add(html);
      } else {
        throw new Error(`Unknown type of block: ${block.classname}`);
      }
    },

    /**
     * Called before the block
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds the datasource
     * @param {qx.html.Element} result where to append any content
     */
    async _before(ds, result) {
      await this._render(this.getBefore(), ds, result);
    },

    /**
     * Called after the block
     *
     * @param {zx.reports.datasource.AbstractDataSource} ds the datasource
     * @param {qx.html.Element} result where to append any content
     */
    async _after(ds, result) {
      await this._render(this.getAfter(), ds, result);
    },

    /**
     * Called when a child is added
     *
     * @param {zx.reports.Block} child
     */
    _addChild(child) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(child.getParent() === null);
      }
      child.setParent(this);
    },

    /**
     * Called when a child is removed
     *
     * @param {zx.reports.Block} child
     */
    _removeChild(child) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(child.getParent() === this);
      }
      child.setParent(null);
    }
  }
});
