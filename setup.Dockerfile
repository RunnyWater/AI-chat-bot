FROM alpine:latest

WORKDIR /setup

COPY setup.sh .
RUN chmod +x setup.sh

ENTRYPOINT ["/setup/setup.sh"]