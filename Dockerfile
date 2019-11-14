FROM node
WORKDIR /google/schedviz
COPY angular-metadata.tsconfig.json package.json yarn.lock ./
RUN yarn install
COPY analysis analysis
COPY client client
COPY doc doc
COPY ebpf ebpf
COPY server server
COPY testhelpers testhelpers
COPY tracedata tracedata
COPY traceparser traceparser
COPY util util
COPY BUILD.bazel WORKSPACE ./
RUN yarn bazel build server
ENTRYPOINT [ "yarn", "bazel", "run", "server", "--", "--", "-storage_path=./examples" ]
EXPOSE 7402
VOLUME examples examples
