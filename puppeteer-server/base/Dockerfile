FROM ubuntu:20.04

RUN apt-get update -y && apt-get install -y wget vim sudo iputils-ping

RUN groupadd -r pptruser && \
    useradd -m -r -g pptruser pptruser

WORKDIR /home/pptruser/

RUN usermod -aG pptruser pptruser && \
    chown -R pptruser:pptruser /home/pptruser

# lie about the home dir to avoid needing to setup permissions for below RUNs
ENV HOME=/home/pptruser
ENV NODE_VERSION=v20.18.0
ENV NVM_HOME=$HOME/.nvm
ENV PATH=$NVM_HOME/versions/node/$NODE_VERSION/bin:$PATH

RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && \
    . $NVM_HOME/nvm.sh && \
    nvm install $NODE_VERSION

RUN npx -y playwright-core@1.50.1 install --with-deps chromium

EXPOSE 9000
EXPOSE 9229
