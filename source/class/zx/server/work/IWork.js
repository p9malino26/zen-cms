/**
 * Represents a piece of work to be executed by an instance of zx.server.work.IWorker
 */
qx.Interface.define("zx.server.work.IWork", {
  members: {
    /**
     * Executes the work
     *
     * @param {zx.server.work.IWorker} worker the Worker that is executing this Work
     * @returns {Promise<>} A promise that resolves when the work is complete
     */
    async execute(worker) {}
  }
});
