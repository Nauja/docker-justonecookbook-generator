docker stop recipe
docker rm recipe
docker run -v ./shared/log:/var/log/service -v ./shared/etc:/etc/service -v ./shared/recipes:/var/recipes -p 8081:8080 --name recipe -it recipeio:latest
