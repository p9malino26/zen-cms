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

## Chromium

A common use case for scheduling a piece of Work is because it needs to use headless Chromium, eg so that it can render a web page as a PDF
or as HTML for emailing etc. Chromium is best suited to running inside a Docker Container because of the process isolation that a Docker
Container provides.

## Types of Worker and Worker Pool

There are three main types of Worker and Worker Pool:
(o) Local - this runs in the main Node (or Browser) process
(o) Thread - this runs in NodeWorker or WebWorker thread
(o) Docker - this uses Docker to run the Worker and Work in a node process, inside a Container

### Docker variations

In production, running Workers and Work inside a container is really useful because there is process isolation and it allows automatic scaling
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
inside Chromium is the other side of a process boundary.

> NOTE:: While the Docker Pool creates and manages Docker Containers, each of which can run Chromium, this is not the same as the class in
> `zx.server.puppeteer.ChromiumDocker` - that class also manages a pool of Chromium instances in Docker, but is deprecated because it has nothing to
> do with the Work/Worker/Worker Pool mechanisms decribed here

# TODO

time and queue Schedulers
nodeProcessLocation in DockerWorkerPool (thisprocess, localhost, container)
connect docker worker to chromium

api paths

(re)move creation of transports
