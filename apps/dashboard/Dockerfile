# build
FROM node:20-alpine AS build
WORKDIR /repo
COPY packages ./packages
COPY apps/dashboard ./apps/dashboard
WORKDIR /repo/apps/dashboard
RUN npm install
RUN npm run build

# runtime
FROM nginx:alpine
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
