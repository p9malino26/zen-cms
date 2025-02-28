# Work, Workers, Worker Pools, and Schedulers

There are lots of occasions when we want to be able to be able to perform a task in the background, collect logs and other generated output,
and then update some kind of status to know when it's complete. If something goes wrong, we need to be able to pull diagnostics from it.

In a small system, maybe running that task asynchronously is enough; and if it is a CPU-intensive task, they you might choose to run that
task in a separate Node Worker thread if its on the server, or a browser Web Worker thread if it's in a client web browser.

As the system scales up, you might want to run the task in an entirely separate nodejs application - possibly even running on seperate
computer elsewhere in your data centre.

In all of the above scenarios, the common elements are that you have a piece of code to execute (lets call it some "Work") that needs to be
run by a process (lets call that process a "Worker") somewhere on the network. You might have lots of these Workers available - for example,
you might organise them into a "Worker Pool", and as more Work has to be done, you would like the Worker Pool to allocate a Worker, and then
have that Worker run your Work.

Some tasks have to run at particular times, eg 5am on Monday-Friday, and so you could have a time-based Scheduler that manages a list of
these tasks; other tasks just need to be executed ASAP, in a first-in-first-out order and so you might have a queue-based Scheduler where
some code just adds some task to queue, and the Scheduler hands that task out as Worker Pools ask for it.

When a Worker has finished a piece of Work, the result of the work includes status (eg success, failure, or an exception) as well as logs;
these are returned to the Scheduler that issued the Work, so that it can record that the task was completed and persist those logs to
somewhere sensible in case they are needed later.

## Robustness

With all of the different parts that communicate with each other, run independently of each other, and asynchronously (perhaps on different
physical servers), this needs to be robust. For example, if the Scheduler goes offline and the Worker finishes the work, it cannot send the
results of the Work (the status and logs) back to the Scheduler ... until the Scheduler comes back online.

The Worker Pool accumulates logs and status information (collectively called Work Results) from the Worker, which in turn receives these
from the Work; the Worker Pool persists the Work Results on disk, and when the task is finished passes them up to the Scheduler; it waits
for the scheduler to become available and accept the Work Results before disposing of them.

Another aspect of a robust system is process isolation - ie the ability to terminate a broken or long running process and reclaim every
resource, without affecting the main process. To do this, you can optionally choose to run the Work inside a Worker which is in its own
NodeJS process, which means that the NodeJS process can be terminated safely and cleanly via the operating system

As a further level of isolation, you can also chose to run the NodeJS process inside a Docker Container - this has the advantage that your
NodeJS process can start applications and have isolation for not just the one JavaScript process. The most typical example of this is to
run headless Chromium inside the Docker Container as well as the NodeJS process.

## Chromium

A common use case for scheduling a piece of Work is because it needs to use headless Chromium, eg so that it can render a web page as a PDF
or as HTML for emailing etc. Chromium is best suited to running inside a Docker Container because of the process isolation that a Docker
Container provides.

## Types of Worker and Worker Pool

There are three main types of Worker and Worker Pool:
(o) Local - this runs in the main Node (or Browser) process
(o) Thread - this runs in Node Worker (ie the ES6 Worker, not "our" Workers) or WebWorker thread
(o) Process - this runs in a separate NodeJS process, optionally inside a Docker Container

All three types of Worker Pool can start Docker Containers to run Chromium - if running Workers inside a Node JS Process, then you can choose
for that NodeJS process to also be inside the Docker Container.

## Docker Containers

In production, running Workers and Work inside a container is really useful because there is process isolation and it allows easy scaling
according to the environment - and if you have a large deployment, you might have multiple Docker installations, each one on different, dedicated
servers, each one operating a Pool of Docker Containers.

Each of those servers will need a node application running a Docker Worker Pool, where it creates Docker Containers to run the Workers and Works

In a smaller deployment, there isn't any need for the complication of having a seperate process in a separate server - it is simpler to just have the
one nodejs server application, which starts Docker Containers locally.

During development, even the smaller deployment makes life difficult - imagine debugging a scenario where your main web server adds a task, which
is then picked up by a another nodejs task, which hands it to a third nodejs task which is running inside a container! Remember that the nodejs
task running inside the container is not normally addressable across the network (or even from the machine running the container) - and yet
debugging means that you have to attach to the process, load source files, etc, in order to be able to step through the code.

It gets even more complicated when you are using Chromium, because the Chromium web page is yet another process that you need to communicate with
and potentially debug; for example, the Work may start Chromium inside the Docker Container, wait for it to start and then navigate to a web page.
That web page will perform a task (eg run a report) and when the report is complete, it will signal to the Work process (via a zx.io.api.\* API)
that it is now ready, and the Work can ask Chromium to render the page as a PDF. That is 4 seperate processes: (1) your web server, talking to (2)
your Docker Worker Pool (potentially running on a remote server), starting and talking to (3) a node process inside the container running the Work,
which in turn talks to (4) the web page inside Chromium.

Obviously while that works very well for production, in development it is a tricky problem to be able to debug across so many process boundaries,
and so there is a configuration where the Scheduler, the Worker Pool, the Worker, and the Work can all run in the current process, and only the
Chromium instance runs inside the Docker Container. Debugging your app is only one node process that needs to be debugged, and only the web page
inside Chromium is the other side of a process boundary (which it is anyway).

> NOTE:: While the Worker creates and manages a Docker Container which can run Chromium, this is **not** the same as the class in
> `zx.server.puppeteer.ChromiumDocker` - that class also manages a pool of Chromium instances in Docker, but is deprecated because it has nothing to
> do with the Work/Worker/Worker Pool mechanisms decribed here

# Examples

There is a command line demo obtained by running `./zx demo worker-pools`; it supports a number of options:

- `--worker-location` - this can be one of:

  - `local` - run a `zx.io.server.work.pools.LocalWorkerPool` so that the tests are in the one process, and in the main event loop
  - `node-thread` - run a `zx.io.server.pools.NodeThreadWorkerPool` so that the tests are in the one process, but in a NodeJS Worker thread
  - `node-process` - run a `zx.io.server.pools.NodeProcessWorkerPool` so that the tests are a seperate NodeJS process, in your operating system
  - `docker` - run a `zx.io.server.pools.NodeProcessWorkerPool` so that the tests are a seperate NodeJS process, inside a Docker Container

- `--pool-min-size` - Workers are kept in a pool, this is the size below which the pool will not drop
- `--pool-max-size` - the largest the pool can be, if the pool is fully used then Work will queue until a Worker is available
- `--clean` - deletes the temporary working directory of the pool
- `--chromium` - enables the Pool to use Chromium, in a Docker Container; this also enabled the Chromium-based test/demo

For example:

```
$ ./zx demo worker-pools --worker-location=docker --pool-min-size=1 --pool-max-size=1 --clean --chromium
```

This command line demo is implemented in the `zx.cli.commands.demo.WorkerPoolsCommand` class

The demo outputs into the ``temp` directory - you'll see folders for the scheduler and for the Worker Pool that you asked it to create; you
should be able to find a directory for each Work, both as it is being processed, and after it has been handed back to the Scheduler.

The Chromium demo will start Chromium, visit `www.google.co.uk` and print the page as a PDF, saving it in `temp/www.google.co.uk.pdf`

# Creating and running Work

Queuing a Work is done by passing a JSON block to the scheduler; the JSON must have as a minimum a `classname` - if you provide a `uuid` property
that will be the `uuid` for the Work, and logs and other working directories will use the `uuid` that you provide, so it is often useful to
make sure that you provide one. If you don't, the Scheduler will provide a random one for you.

The class that you name must implement the `zx.server.work.IWork` interface.

For example:

```
      scheduler.pushWork({
        uuid: qx.util.Uuid.createUuidV4(),
        classname: zx.demo.server.work.TestWork.classname
      });
```

When a Worker runs the Work, it instantiates the class and call's it's execute method, passing an instance of the Worker class that is calling it;
you can use the `Worker` class to access Chromium and get path mappings. The `zx.demo.server.work.TestChromiumWork` has examples of using both,
but the principal is that this will save a PDF of a web page:

```
  execute(worker) {
      let chromium = await worker.getChromium();

      let puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
        url: "http://www.google.co.uk",
        debugOnStartup: false,
        chromiumEndpoint: chromium.getEndpoint()
      });
      await puppeteer.start();
      let filename = worker.resolveFile("demodata/www.google.co.uk.pdf");
      await puppeteer.printToPdf(filename);
      await puppeteer.stop();
```

# Mapping filenames

Because Worker and Work can run in different Operating Systems (whether inside a Docker Container, or on a remote server, or a Docker Container
inside a remote server), the Work dfoes not necessarily share the same disk access as the main NodeJS process.

The Worker Pool can be configured to map aliases (ie a kind of short, alphabetic name) to filing system paths - it is up to the Worker Pool to
map these into the Container. For example, in the `zx demo worker-pools` command, the `demodata` directory is mapped to the `temp` directory
which means that the `zx.demo.server.work.TestChromiumWork` class can write to `demodata/www.google.co.uk.pdf` file and have that appear inside
the `temp` directory - regardless of whether the Work in the NodeJS process, or whether it is in a Docker Container.

# TODO

time Scheduler
