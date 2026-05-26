# build
FROM node:20-alpine AS build
WORKDIR /repo
COPY packages ./packages
COPY modules ./modules
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN npm install
RUN npm run build

# runtime
FROM node:20-alpine
WORKDIR /repo/apps/api
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./
EXPOSE 4000
CMD ["npm", "start"]
