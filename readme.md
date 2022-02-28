# Zen [and the art of] CMS

Open source server development framework project, based around a core functionality of a CMS and written
full stack in Javascript with Qooxdoo.

Features include:

- Complete CMS, with
  - Nunjucks based skinning
  - Pages composed of Qooxdoo components, each individually editable
  - Admin app for content editing and security admin
- Database persistence of objects
- Remote Object invocation and property synchronisation
- Security Model
- Server rendering of plain HTML
- Thin client UI (based on server rendering)
- Toolkit for writing reusable, composable object editor Widgets
- CLI for administration and running
- Test and demonstration framework

This project is at alpha stage.

Please see [docs/overview.md](docs/overview.md) for an overview of how the CMS works and what functionality
it brings

## TODO

- Handle PROTECTED properties
- Move known uuids into endpoint, and out of controller
- How to handle referenced objects being deleted? EG permissions
- qx.html.Node.{serialize,useNode} - when you add an un-owned block of HTML, that needs to be translatable back into classes, even though the caller has to identify them separately
