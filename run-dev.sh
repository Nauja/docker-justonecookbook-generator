docker stop cookbookio
docker rm cookbookio
docker run -v /var/log/justonecookbook-generator/:/root/.npm/_logs/ -v /home/projects/docker-justonecookbook-generator/service:/home/service -p 25000:8080 --name cookbookio -it cookbookio:node sh -c "cd /home/service && npm install && node main.js"
