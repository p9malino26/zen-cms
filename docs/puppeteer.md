# Puppeteer and Docker

ZenCMS includes an open source Puppeteer server in a Docker Container, which you can use to run
headless instances of Chromium; this container is designed to run standalone and is published
at docker.io as zenesisuk/zx-puppeteer-server

The ZenCMS framework also includes a framework to use Puppeteer within those docker instances,
including process control and pooling containers.

## Docker Firewall

One issue to be aware of is that Docker will, by default, configure your firewall using `iptables` -
this means that if you have `firewalld` or `ufw` you may have a conflict.

The solution is to either (a) disable and stop using your existing firewall, or (b) stop Docker
from using `iptables` and configure your firewall appropriately.

Here's two articles that explain why, whats's happening, and how to do it:

https://erfansahaf.medium.com/why-docker-and-firewall-dont-get-along-with-each-other-ddca7a002e10

https://dev.to/soerenmetje/how-to-secure-a-docker-host-using-firewalld-2joo
