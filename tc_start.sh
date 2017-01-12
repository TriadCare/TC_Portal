#!/bin/bash
echo 'Starting Development Server...'

trap 'echo -e "\nDevelopment Server Terminated"; kill %1' SIGINT

npm start & (source ../../tc_env/bin/activate && python rundevserver.py);

trap - SIGINT
trap
