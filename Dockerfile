FROM node:14-alpine as builder
WORKDIR /app
ENV NODE_ENV development
COPY package.json .
RUN npm install --verbose
COPY front-src/ front-src/
COPY webpack.config.js .
RUN npm run build

FROM node:14-alpine
WORKDIR /app
RUN adduser -S dummy -G node && \
    chown -R dummy:node .

ENV NODE_ENV production
COPY . .
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/public public/

USER dummy

CMD ["npm", "start"]