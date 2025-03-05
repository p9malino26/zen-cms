qx.Class.define("zx.server.work.scheduler.ScheduledTask", {
  extend: zx.server.Object,
  implement: [zx.io.persistence.IObjectNotifications],

  properties: {
    /** Title for the task */
    title: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeTitle"
    },

    /** Description of the task */
    description: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "String",
      event: "changeDescription"
    },

    owner: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "String",
      event: "changeOwner"
    },

    /** Date when the task was scheduled */
    dateScheduled: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "Date",
      event: "changeDateScheduled"
    },

    /** Date when the task was last started */
    dateStarted: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "Date",
      event: "changeDateStarted"
    },

    /** Date when the task was last completed */
    dateCompleted: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "Date",
      event: "changeDateCompleted"
    },

    /** Whether this is recurring */
    recurring: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: false,
      nullable: false,
      check: "Boolean",
      event: "changeRecurring"
    },

    /** How long to keep the task in the database/on disk after it completes, if it is not recurring */
    keepForDays: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "Integer",
      event: "changeKeepForDays"
    },

    /** Cron expression for when to run the task */
    cronExpression: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: null,
      nullable: true,
      check: "String",
      event: "changeCronExpression"
    },

    /** Whether the task is enabled */
    enabled: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      init: true,
      nullable: false,
      check: "Boolean",
      event: "changeEnabled"
    },

    /** JSON object for Work */
    workJson: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      nullable: false,
      check: "String",
      event: "changeWorkJson"
    }
  },

  members: {
    async receiveDataNotification(key, data) {
      await super.receiveDataNotification(key, data);
      if (key === zx.io.persistence.IObjectNotifications.BEFORE_WRITE_TO_JSON) {
        if (!this.getDateScheduled() == null) {
          this.setDateScheduled(new Date());
        }
      }
    }
  }
});
