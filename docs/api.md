# APIs

When working within one process, communicating between objects and libraries is natural and easy - just get an object, call method, etc

Increasingly, there are situations where you might want to talk across processes - it is quite common to build REST APIs that allow users to communicate
with web server with GET/POST/etc requests. With REST, both the client (which could be a human using `wget`/`curl`, or an application) and the server
follow a predefined protocol, and there can be a fair amount of work involved to implement the protocol, even before the functionality behind the API
is implemented.

REST APIs work over HTTP and HTTPS, but there are other protocols over which you might want to implement an API mechanism - for example, when working with
NodeJS Worker threads, the only communication offered is the very crude and basic `postMessage`, and it is not long before an actual API with methods, properties,
and events would be very useful. Similarly, when controlling pages via Chromium (eg see `zx.server.puppeteer.*`), the only way to communicate with it is
by embedding output in the browser's `console.log` and injecting code.

The ZX `zx.io.api.*` classes provide a wrapper around the implementation of APIs, which allow you to write client and server code which simply implements an
interface defined by `qx.Interface`, and takes care of the protocol implementation to connect the two.

As an added bonus, when the APIs are configured to be available via HTTP, they become standard REST protocol implementations.

The protocols supported are:

- HTTP / HTTPS
- NodeJS Workers
- Browser Web Workers
- Loopback
- Bluetooth

## Loopback

The abstraction of transport protocol has another benefit - that you can configure, at runtime, where certain components are located; for example, in the
`zx.server.work.*` tools, you can choose to run code asynchronously in either the current process (great for debugging) or in a seperate process in a container
(great for process isolation and reliable scalability).

## Implementing an API

An API implementation is either a Client (`zx.io.api.client.AbstractClientApi`) or a Server (`zx.io.api.client.AbstractClientApi`), and while you can derive
from these classes and add features for ultimate flexibility of configuration, the easiest way is to define an interface and then use a tool to create the
Client and Server classes automatically.
