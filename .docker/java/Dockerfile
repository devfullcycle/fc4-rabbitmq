FROM gradle:8.14.1-jdk21-alpine

WORKDIR /home/gradle/app

RUN apk update && apk add nodejs npm && apk cache clean --force

USER gradle

CMD ["tail", "-f", "/dev/null"]
