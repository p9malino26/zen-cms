/**
 * Tagging interface for the native object
 * representing the information describing a work item.
 * It specifies the instance of `zx.server.work.IWork` plus extra info
 *
 * Some types of IWork may require this to have more fields,
 * but this is just the bare minimum.
 */
qx.Interface.define("zx.server.work.IWorkJson", {
  members: {
    /**
     * Name of this instance of `zx.server.work.IWork`
     * that is going to run
     */
    workClassname: "",

    /**
     * @type {string}
     * Unique identifier for this work item
     * The instance of `zx.server.work.IWork` will have its UUID set to this
     */
    uuid: "",

    /**
     * @type {string}
     */
    title: "",

    /**
     * @type {string}
     */
    description: "",

    /**
     * @type {Array<*>}
     * Arguments to pass into constructor of `zx.server.work.IWork`
     */
    args: []
  }
});
