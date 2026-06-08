# build
FROM node:20-alpine AS build
WORKDIR /repo

COPY packages ./packages
COPY modules ./modules
COPY apps/dashboard ./apps/dashboard
COPY enclave.modules.client.ts ./enclave.modules.client.ts

WORKDIR /repo/apps/dashboard
RUN npm install

WORKDIR /repo
RUN cp -r apps/dashboard/node_modules ./node_modules

WORKDIR /repo/apps/dashboard
RUN npm run build

# runtime
FROM nginx:alpine
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80