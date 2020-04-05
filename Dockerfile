FROM debian:latest

# Config and templates
VOLUME [ "/etc/service" ]

# Python logs
VOLUME [ "/var/log/service" ]

# Generated PDF recipes
VOLUME [ "/var/recipes" ]

ADD service /home/service
ADD requirements.txt /home/requirements.txt

WORKDIR /home

RUN apt-get upgrade -y && \
    apt-get update -y && \
    apt-get install -y python3 python3-pip wkhtmltopdf && \
	python3 -m pip install -r requirements.txt

CMD [ "python3", "-m", "service", "--config", "/etc/service/config.cnf" ]

EXPOSE 8080
