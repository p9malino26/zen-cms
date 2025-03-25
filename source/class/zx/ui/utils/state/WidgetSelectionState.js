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

qx.Class.define("zx.ui.utils.state.WidgetSelectionState", {
  extend: zx.ui.utils.state.TargetState,

  /**
   * Constructor
   *
   * @param {zx.ui.utils.UserState} state where to store detected state
   * @param {qx.ui.core.Widget} widget
   * @param {Boolean} isDynamic whether the items are dynamic data or static via QxObjectIDs
   */
  construct(state, widget, isDynamic) {
    super(state, widget, isDynamic);
    this._addListenerFor("changeSelection", () => this.copySelectionToState());
    if (!isDynamic) {
      this._addListenerOnceFor("appear", () => this.copyStateToSelection());
    }
  },

  members: {
    /**
     * @Override
     */
    copyStateToSelection() {
      let target = this.getTarget();

      let id = this.getTargetId();
      if (!id) {
        return;
      }

      let valueIds = this._get(id) || [];
      if (!qx.lang.Type.isArray(valueIds)) {
        valueIds = [valueIds];
      }
      let values = null;
      if (!this.isDynamic()) {
        values = valueIds
          .map(valueId => {
            let value = qx.core.Id.getQxObject(valueId);
            if (!value && valueId) {
              this._notify(`Cannot restore state of ${target.classname} (${target}) because it's value ${valueId} does not exist`);
            }
            return value;
          })
          .filter(item => !!item);
      } else {
        let lookup = {};
        valueIds.forEach(valueId => (lookup[valueId] = true));
        values = target.getChildren().filter(item => lookup[this._getIdOfItem(item)]);
      }
      target.setSelection(values);
    },

    /**
     * @Override
     */
    copySelectionToState() {
      let id = this.getTargetId();
      if (!id) {
        return;
      }

      let valueIds = this.getTarget()
        .getSelection()
        .map(item => this._getIdOfItem(item));
      this._put(id, valueIds);
    }
  }
});
