FROM alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
    bash \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    nodejs npm \
    yarn

RUN apk add vim

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer
RUN yarn add puppeteer

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser
RUN mkdir -p /home/pptruser/Downloads /home/pptruser/app

WORKDIR /home/pptruser/
COPY container/* .
RUN npm i

RUN chown -R pptruser:pptruser . /home/pptruser/app

# Run everything after as non-privileged user.
USER pptruser

# ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD ["/bin/bash", "/home/pptruser/start.sh"]

EXPOSE 9000
EXPOSE 9229


