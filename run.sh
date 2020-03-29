docker stop test
docker rm test
docker run -d -v /var/log/justonecookbook-generator/:/root/.npm/_logs/ -p 25000:8080 --name test -it cookbookio
