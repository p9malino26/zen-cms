# Zen CMS Thin Client UI

The Thin Client UI builds on the Qooxdoo [JSX and Virtual DOM framework](virtual-dom.md) to add a series
of basic UI widgets that make it easy to build tiny applications suitable for use as part of a page of content.

This is not a replacement or alternative to the Qooxdoo Desktop or Mobile application development techniques -
both Desktop and Mobile have a very rich set of widgets and highly evolved functionality, all of which is focused
on building applications with detailed user experience.

The Thin Client UI is targeted at the other end of the spectrum, ie it is for simple pieces of visual interaction
with the user that must be very lightweight (i.e. small code size), styled by normal CSS, and without any layout rules
or "framework" requirements.

The design and implementation is based on the Google Materials UI components, which means that one set of widgets
is suitable for mobile as well as desktop browser and the functionality is clear and limited. Do not expect to find
complex controls like `qx.ui.tree` etc.

The widgets are:

- Form Widgets
  -- `zx.thin.ui.form.TextField` - text field with prompts, character counts, etc
  -- `zx.thin.ui.form.Button` - simple button types
  -- `zx.thin.ui.form.CheckBox` - checkbox
  -- `zx.thin.ui.form.RadioButton` - radiobutton
  -- `zx.thin.ui.form.Switch` - drop down list
- Other
  -- `zx.thin.ui.basic.Image` - an image
- Containers
  -- `zx.thin.ui.container.Composite` - a grouping for layout
  -- `zx.thin.ui.container.Window` - a popup window
  -- `zx.thin.ui.container.Dialog` - a popup window with buttons etc
