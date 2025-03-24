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
 * Watches the state of a controller
 */
qx.Class.define("zx.ui.utils.state.ControllerState", {
  extend: zx.ui.utils.state.TargetState,

  /**
   * Constructor
   *
   * @param {zx.ui.utils.UserState} state where to store detected state
   * @param {qx.data.controller.ISelection} ctlr
   */
  construct(state, ctlr) {
    super(state, ctlr, true);
    this._attachSelection();
    this._addListenerFor("changeSelection", this._changeSelection);
    this._addListenerFor("beforeApplyModel", () => (this.__inChangeModel = true));
    this._addListenerFor("afterApplyModel", () => (this.__inChangeModel = false));
    this._addListenerFor("changeModel", this._changeModel);
    let model = ctlr.getModel();
    if (model) {
      this.copyStateToSelection();
    }
  },

  destruct() {
    let sel = this.getTarget().getSelection();
    if (sel) {
      sel.removeListener("change", this._changeSelectionContents, this);
    }
  },

  members: {
    // Whether the model is currently changing
    __inChangeModel: false,

    /**
     * Event handler for changes to the controller's model property
     *
     * @param {qx.event.type.Data} evt
     */
    _changeModel(evt) {
      let model = evt.getData();
      if (model) {
        this.copyStateToSelection();
      }
    },

    /**
     * Event handler for changes to the controller's selection property
     *
     * @param {qx.event.type.Data} evt
     */
    _changeSelection(evt) {
      if (!this.__inChangeModel) {
        let oldSelection = evt.getOldData();
        if (oldSelection) {
          oldSelection.removeListener("change", this._changeSelectionContents, this);
        }
        this._attachSelection();
        this.copySelectionToState();
      }
    },

    /**
     * Adds listeners to the selection to detect changes
     */
    _attachSelection() {
      let selection = this.getTarget().getSelection();
      if (selection) {
        selection.addListener("change", this._changeSelectionContents, this);
      }
    },

    /**
     * Event handler for changes to the contents of controller's selection array
     *
     * @param {qx.event.type.Data} evt
     */
    _changeSelectionContents(evt) {
      if (!this.__inChangeModel) {
        this.copySelectionToState();
      }
    },

    /**
     * @Override
     */
    copyStateToSelection() {
      let id = this.getTargetId();
      if (!id) {
        return;
      }

      let model = this.getTarget().getModel();
      if (!model) {
        return;
      }

      let valueIds = {};
      (this._get(id) || []).forEach(valueId => (valueIds[valueId] = true));
      let sel = model.toArray().filter(item => valueIds[this._getIdOfItem(item)]);
      this.getTarget().getSelection().replace(sel);
    },

    /**
     * @Override
     */
    copySelectionToState() {
      let id = this.getTargetId();
      if (!id) {
        return;
      }

      let selection = this.getTarget().getSelection();
      let ids = selection.toArray().map(item => this._getIdOfItem(item));
      this._put(id, ids);
    }
  }
});
