FROM tsl0922/ttyd

EXPOSE 7681

COPY ./sources.list /etc/apt/sources.list

RUN apt update && apt install -y sshpass

CMD ["ttyd", "-W", "bash"]

# docker build -t ssh/ttyd .