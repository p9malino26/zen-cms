# Applications

## The Zen Thin Client

Up until now, a Qooxdoo application that runs in a web browser is either a "Desktop" or a "Mobile" application,
and both are targeted at building fully functional, cross platform Single Page Applications where
the entire user interface of the browser is taken over. Normal browser form controls are replaced,
and styling works in a very specific way that is focused on widget development, and which most
graphic designers will simply not understand.

Ordinary web pages use only the traditional features and tools, and while they most probably will
include _some_ javascript, it's likely to be a lot less complex than "Desktop" or "Mobile" apps and
absolutely must be a lot smaller and faster to load.

The Qooxdoo framework has a lot to offer when it comes to writing that javascript for "ordinary"
pages - it provides classes, feature detection, virtual DOM, cross platform guarantees,
utilities, ... and a lot more, but it does not currently offer any tools for a light weight
user interface.

The "Thin Client" concept is the idea that you can write code in the same way that you normally do,
using the same framework, and have the Qooxdoo Compiler generate a cut down, minimized application
that is small enough to deliver with every web page.

One of the most attractive advantages is that you can have one code base, and use the exact same code
on the client and the server - in fact, the same code could be in web pages, in your Desktop app,
Mobile app, and Server app.

(BTW this is not the same as the same as Qooxdoo "next" branch from many years ago, or the "qxWeb"
project which is deprecated in Qooxdoo v6 - "next" and "qxWeb" were a kind of half rewrite of Qooxdoo,
that was focused on providing new widgets with a new syntax. A "Thin Client" is just the concept
of a minimal compilation of Qooxdoo, which provides no user interface by itself, and which is
connected to server code by Features).

## Conventional Qooxdoo Desktop and Mobile applications

Conventional Qooxdoo Desktop and Mobile applications are a normal part of the CMS - in fact, the Admin UI is
itself a Desktop application. The Zen CMS understands about source vs build, and will provides the special
URL `/zx/code` that automatically maps to the correct target.

Note that a Zen CMS project will have at least three applications - Server, Desktop (the Admin UI), and Thin Client -
but it's quite possible that you might develop your own Desktop and/or Mobile applications and so it's not
unusual for there to be 4 or 5 applications, all of which work together.

## Communication between applications

Because of the features provided by `zx.io.remote.*`, the objects in the CMS server would be
available in server, the Admin UI application, and the Thin Client application; edits made in one place
will be automatically reflected in the others.
