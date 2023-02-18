#!/bin/bash

set -e

printhelp()
{
	echo "Usage: $0 [options]
Options:
  -h, --help                            display this help message and exit.
  -p, --port PORT                       listen port.
  -n, --dbname NAME                     mysql database name.
  -u, --dbuser USERNAME                 mysql user.
  -ju, --judgeurl URL                   url of judge.
  -vu, --vncproxyurl URL                url of vncproxy." 1>&2
	exit 1
}

dirpath=$(dirname "$0")

judgeurl="localhost:8000"
vncproxyurl="localhost:4000"
port="3000"
dbname="nasa"
dbuser="nasa"

while [ "$1" != "" ]
do
    case "$1" in
        -h|--help)
            printhelp
            ;;
        -p|--port)
            shift
            port=$1
            ;;
        -n|--dbname)
            shift
            dbname=$1
            ;;
        -u|--dbuser)
            shift
            dbuser=$1
            ;;
        -ju|--judgeurl)
            shift
            judgeurl=$1
            ;;
        -vu|--vncproxyurl)
            shift
            vncproxyurl=$1
            ;;
    esac
    shift
done

read -p "Enter database user $dbuser Password: " -s dbpassword

ansible-galaxy collection install -r $dirpath/requirements.yml -f
ansible-galaxy role install -r $dirpath/requirements.yml -f

ansible-playbook $dirpath/setup.yml -e "{\"port\":$port,\"dbname\":\"$dbname\",\"dbuser\":\"$dbuser\",\"dbpassword\":\"$dbpassword\",\"judgeurl\":\"$judgeurl\",\"vncproxyurl\":\"$vncproxyurl\"}"

echo ""
echo ""
echo "NASA Judge Backend install.sh complete."
echo "Fix your config file at /etc/nasajudgebackend/.env"
echo "Then you can use systemctl start nasajudgebackend.service to start the service"
echo "If you want to auto run on boot please type 'systemctl enable nasajudgebackend.service'"
