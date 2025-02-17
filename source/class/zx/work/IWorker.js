/**
 * Represents an entity that can execute a piece of work.
 * This can be a JavaScript worker, NodeJS worker, or a docker container,
 * or a local process
 */
qx.Interface.define("zx.work.IWorker", {
  members: {
    /**
     * Executes the piece of work
     * @param {zx.work.IWork} work The piece of work to execute
     */
    run(work) {}
  }
});
