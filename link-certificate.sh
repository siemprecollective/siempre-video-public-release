#!/bin/bash

TARGET_LOCATION="./node_modules/webpack-dev-server/ssl/server.pem"
SOURCE_LOCATION="/home/phillip/server.pem"

echo Linking ${TARGET_LOCATION} TO ${SOURCE_LOCATION}
rm -f ${TARGET_LOCATION} || true
ln -s ${SOURCE_LOCATION} ${TARGET_LOCATION}
chmod 400 ${TARGET_LOCATION} # after 30 days create-react-app tries to generate a new certificate and overwrites the existing one. 
echo "Created server.pem symlink"
