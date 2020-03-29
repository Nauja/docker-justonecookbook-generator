read -r -p "Build pandoc image (y/n)?" response
response=${response,,}
if [[ $response =~ ^(yes|y| ) ]] || [[ -z $response ]]; then
docker rmi cookbookio:pandoc
docker build -t cookbookio:pandoc -f Dockerfile-pandoc .
fi

read -r -p "Build node image (y/n)?" response
response=${response,,}
if [[ $response =~ ^(yes|y| ) ]] || [[ -z $response ]]; then
docker rmi cookbookio:node
docker build -t cookbookio:node -f Dockerfile-node .
fi

read -r -p "Build dev image (y/n)?" response
response=${response,,}
if [[ $response =~ ^(yes|y| ) ]] || [[ -z $response ]]; then
docker rmi cookbookio:dev
docker build -t cookbookio:dev -f Dockerfile-cookbookio-dev .
fi

read -r -p "Build latest image (y/n)?" response
response=${response,,}
if [[ $response =~ ^(yes|y| ) ]] || [[ -z $response ]]; then
docker rmi cookbookio:latest
docker build -t cookbookio:latest -f Dockerfile-cookbookio .
fi
