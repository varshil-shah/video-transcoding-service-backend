FROM ubuntu

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y

RUN apt-get install -y nodejs
RUN apt-get install -y ffmpeg 

WORKDIR /app

COPY package*.json .
RUN npm install

COPY utils/ utils/
COPY index.js index.js

CMD ["node", "index.js"]
