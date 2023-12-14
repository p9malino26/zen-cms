/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

qx.Class.define("zx.ui.tree.simple.Node", {
  extend: zx.ui.tree.simple.AbstractNode,

  construct(label, icon, model) {
    super(label, icon, model);
    this._children.addListener("change", this._onChildrenChange, this);
  },

  members: {
    moveTo(child, after) {
      if (!this._children.contains(child)) {
        this._children.insertAfter(after, child);
        return;
      }
      var arr = this._children.toArray();
      var fromIndex = arr.indexOf(child);
      arr.splice(fromIndex, 1);
      if (!after) {
        arr.unshift(child);
      } else {
        var toIndex = arr.indexOf(after) + 1;
        if (toIndex == arr.length) {
          arr.push(child);
        } else arr.splice(toIndex, 0, child);
      }
      if (fromIndex != arr.indexOf(child)) {
        this._children.fireDataEvent(
          "change",
          {
            start: 0,
            end: arr.length - 1,
            type: "order",
            items: null
          },

          null
        );
      }
    },

    _onChildrenChange(evt) {
      var data = evt.getData();
      var t = this;

      function added(lst) {
        for (var i = 0; i < lst.length; i++) {
          lst[i].set({ parent: t });
        }
      }
      function removed(lst) {
        for (var i = 0; i < lst.length; i++) {
          lst[i].set({ parent: null });
        }
      }

      if (data.type == "add") {
        added(data.added);
      } else if (data.type == "remove") {
        removed(data.removed);
      } else if (data.type == "add/remove") {
        added(data.added);
        removed(data.removed);
      }

      this.fireDataEvent("changeChildren", data);
    }
  }
});
