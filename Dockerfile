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

ENV PYTHONPATH "${PYTHONPATH}:/home"

RUN apt-get upgrade -y && \
    apt-get update -y && \
    apt-get install -y wget python3 python3-pip wkhtmltopdf texlive xvfb && \
    wget -O /tmp/pandoc.deb https://github.com/jgm/pandoc/releases/download/2.9.2.1/pandoc-2.9.2.1-1-amd64.deb && \
    dpkg -i /tmp/pandoc.deb && \
    rm /tmp/pandoc.deb && \
    python3 -m pip install -r requirements.txt

CMD [ "python3", "-m", "service", "/etc/service" ]

EXPOSE 8080
