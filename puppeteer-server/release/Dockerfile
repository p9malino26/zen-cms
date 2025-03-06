FROM zenesisuk/zx-puppeteer-server-base:latest

RUN mkdir -p /home/pptruser/Downloads /home/pptruser/app/runtime

WORKDIR /home/pptruser/
COPY container .
COPY runtime app/runtime

WORKDIR /home/pptruser/app
RUN npm ci
RUN chown -R pptruser:pptruser "/home/pptruser/.npm"
RUN chown -R pptruser:pptruser "/home/pptruser/app"


USER pptruser

CMD ["/bin/bash", "/home/pptruser/bin/start.sh"]

