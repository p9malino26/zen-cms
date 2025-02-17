/**
 *
 * Application that runs on a docker container, executing the tasks (zx.server.work.IWork)
 */
qx.Class.define("zx.demo.server.work.dockerpeer.Service", {
  extend: zx.server.work.runtime.DockerPeerService,
  construct() {
    super();
    zx.demo.server.work.TestWork;
    zx.demo.server.work.ErrorWork;
  }
});
