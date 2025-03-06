/**
 * @typedef WorkQueueEntry
 * @property {String} cronExpression the cron expression for the task
 * @property {String} workJson the work to do
 */
qx.Class.define("zx.server.work.scheduler.DbScanner", {
  extend: qx.core.Object,
  include: [uk.co.spar.services.MMongoClient],

  /**
   * Constructor; adds work to the QueueScheduler from the database
   *
   * @param {zx.server.work.scheduler.QueueScheduler} queueScheduler
   */
  construct(queueScheduler) {
    super();
    this.__queueScheduler = queueScheduler;
  },

  members: {
    /** @type{zx.server.work.scheduler.QueueScheduler} */
    __queueScheduler: null,

    /** @type{Object<String, WorkQueueEntry>} */
    __pendingImmediateTasks: {},
    __pendingScheduledTasks: {},

    __pollDatabasePromise: null,

    /**
     * Starts the scanner
     */
    async start() {
      this.__queueScheduler.addListener("noWork", this.triggerDatabaseCheck, this);
      this.__queueScheduler.addListener("workStarted", this.__onWorkStarted, this);
      this.__queueScheduler.addListener("workCompleted", this.__onWorkCompleted, this);
    },

    /**
     * Stops the scanner
     */
    async stop() {
      this.__queueScheduler.removeListener("noWork", this.triggerDatabaseCheck, this);
    },

    /**
     * Causes the database to be checked for more work (if enabled)
     */
    triggerDatabaseCheck() {
      if (this.__pollDatabasePromise) {
        return;
      }
      this.__pollDatabasePromise = this.__pollDatabase();
      this.__pollDatabasePromise.then(() => {
        this.__pollDatabasePromise = null;
      });
    },

    /**
     * Event handler for polling the database for more work
     */
    async __pollDatabase() {
      let cursor = await this.aggregate(zx.server.work.scheduler.ScheduledTask, [
        {
          $match: {
            enabled: true,
            cronExpression: null
          }
        }
      ]);
      while (await cursor.hasNext()) {
        let json = await cursor.next();
        if (!this.__pendingImmediateTasks[json._uuid] && !this.__pendingScheduledTasks[json._uuid]) {
          delete this.__pendingImmediateTasks[json._uuid];
          delete this.__pendingScheduledTasks[json._uuid];
          if (!json.cronExpression) {
            this.__pendingImmediateTasks[json._uuid] = json;
            this.debug(`Found immediate task ${json._uuid} in database`);
            json.workJson.uuid = json._uuid;
            this.__queueScheduler.pushWork(json.workJson);
          } else {
            this.debug(`Found cron task ${json._uuid} in database - CRON IS NOT IMPLEMENETED`);
            this.__pendingScheduledTasks[json._uuid] = {
              cronExpression: json.cronExpression,
              uuid: json._uuid,
              dateCompleted: json.dateCompleted
            };
          }
        }
      }
    },

    /**
     * Event handler for when the QueueScheduler starts executing a piece of IWork
     *
     * @param {*} evt
     */
    async __onWorkStarted(evt) {
      let workJson = evt.getData();
      await this.updateOne(
        zx.server.work.scheduler.ScheduledTask,
        { _uuid: workJson.uuid },
        {
          $set: {
            dateStarted: new Date()
          }
        }
      );
    },

    /**
     * Event handler for when the QueueScheduler finishes executing a piece of IWork
     *
     * @param {*} evt
     */
    async __onWorkCompleted(evt) {
      let workResultJson = evt.getData();
      let uuid = workResultJson.workJson.uuid;
      if (this.__pendingImmediateTasks[uuid]) {
        await this.updateOne(
          zx.server.work.scheduler.ScheduledTask,
          { _uuid: uuid },
          {
            $set: {
              enabled: false,
              dateCompleted: new Date()
            }
          }
        );
        delete this.__pendingImmediateTasks[uuid];
      } else if (this.__pendingScheduledTasks[uuid]) {
        let dt = new Date();
        await this.updateOne(
          zx.server.work.scheduler.ScheduledTask,
          { _uuid: uuid },
          {
            $set: {
              dateCompleted: dt
            }
          }
        );
        this.__pendingScheduledTasks[uuid].dateCompleted = dt;
      }
    }
  }
});
