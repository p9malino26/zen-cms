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


/**
 * Populates a work in progress window,
 */
qx.Class.define("zx.thin.ui.utils.WorkInProgress", {
  extend: zx.thin.ui.utils.AbstractMessage,
  type: "singleton",

  construct() {
    this.base(arguments, "Working, please wait...", "Work In Progress", []);
    let tasks = new qx.data.Array();
    tasks.addListener("change", this._onTasksChange, this);
    this.setTasks(tasks);
    this.setCentered("both");
  },

  properties: {
    /** Refine the caption */
    caption: {
      init: "Work In Progress...",
      refine: true
    },

    /** The list of tasks */
    tasks: {
      check: "qx.data.Array",
      transform: "_transformTasks"
    }
  },

  members: {
    __promiseComplete: null,

    /**
     * Returns a promise that will resolve when all tasks are complete
     *
     * @return {qx.Promise}
     */
    promiseComplete() {
      if (!this.getTasks().getLength()) return qx.Promise.resolve();
      if (!this.__promiseComplete) this.__promiseComplete = new qx.Promise();
      return this.__promiseComplete;
    },

    /**
     * Transforms the tasks array, to keep the same object
     */
    _transformTasks(value, oldValue) {
      if (oldValue) {
        if (value) oldValue.replace(value);
        else oldValue.removeAll();
        return oldValue;
      } else {
        return value;
      }
    },

    /**
     * Adds a task; if `task` is a string, a new WipTask is created
     *
     * @param task {String|WipTask} the message or WipTask to add
     * @return {WipTask} the task that was added
     */
    addTask(task) {
      if (typeof task == "string") task = new zx.thin.ui.utils.WipTask(task);
      this.getTasks().push(task);
      return task;
    },

    /**
     * Removes a task
     *
     * @param task {WipTask} the task to remove
     */
    removeTask(task) {
      this.getTasks().remove(task);
    },

    /**
     * Event handler for when the list of tasks changes
     *
     * @param evt {qx.event.type.Event}
     */
    _onTasksChange(evt) {
      let data = evt.getData();
      if (data.removed) {
        data.removed.forEach(task => {
          task.removeListener("changeMessage", this._onTaskChangeMessage, this);
          task.removeListener(
            "changeComplete",
            this._onTaskChangeComplete,
            this
          );
        });
      }
      if (data.added) {
        data.added.forEach(task => {
          task.addListener("changeMessage", this._onTaskChangeMessage, this);
          task.addListener("changeComplete", this._onTaskChangeComplete, this);
        });
      }
      let tasks = this.getTasks();
      if (!tasks.getLength()) {
        this.hide();
        if (this.__promiseComplete) {
          let p = this.__promiseComplete;
          this.__promiseComplete = null;
          p.resolve();
        }
        return;
      }
      this.__updateMessage();
      this.show();
    },

    /**
     * Updates the display
     */
    __updateMessage() {
      let tasks = this.getTasks();
      let elem = this.getQxObject("message");
      elem.removeAll();
      tasks.forEach((task, index) => {
        if (index) elem.add(<br></br>);
        elem.add(<span>{task.getMessage()}</span>);
      });
      qx.html.Element.flush();
      this.center();
      qx.html.Element.flush();
    },

    /**
     * Event handler for when the message of a task changes
     */
    _onTaskChangeMessage(evt) {
      this.__updateMessage();
    },

    /**
     * Event handler for when a tasks completes
     */
    _onTaskChangeComplete(evt) {
      let task = evt.getTarget();
      this.removeTask(task);
    }
  }
});
