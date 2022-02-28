# Directories

The CMS needs a directory to serve as the root of the website, to contain files and pages to serve up
as well as special files like theming or database files.

By default, the CMS will expect the directory to be called `website` and this will exist in the root
of your project directory. You can change this by editing the `cms.json` and setting the `directory: "path/to/website"`
property.

Within that root directory, you can store any files you like and these will be served automatically by
the webserver - there is one restriction, which is that the filename (or directory name) must not begin
with an underscore. While your code can use files/directories which begin with an `_`, these are considered
private, hidden files and will not be served automatically.

## The `website/_cms` directory

The CMS expects there to be one special hidden directory called `_cms`, where various files will be stored
or expected.

You can add files to this directory if you want to, but bear in mind that the layout and names may change -
you would be better off choosing your own hidden directory.

## The `website/_cms/db` directory

This contains database related files; the two main subfolders are `nedb`, which stores the actual NEDB
database, and also `template`, which is used to automatically populate the NEDB database under certain
circumstances - typically, when the database does not exist, the `template` directory can be used
to preload it from a form that is easily editable in any text editor.

[Read more about CMS Database](database.md)

## The `website/_cms/themes` directory

Themes are stored either under the `resources` directory of your code or a package, or they are stored
in the `website/_cms/themes` directory. Each theme name must follow the naming rules of a typical Qooxdoo
class identifier, for example `themes.MyTheme`

[Read more about CMS Theming](theming.md)
