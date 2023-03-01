# NASA Backend
NCKU NASA judge Backend service

- [Install](#Install)
- [Remove](#Remove)

## Install
1. clone this repo and cd into nasa-judge-backend.

```bash
git clone https://github.com/NCKU-NASA/nasa-judge-backend
cd nasa-judge-backend
```

2. run `bash install.sh -h` to see help
```bash
Usage: install.sh [options]
Options:
  -h, --help                            display this help message and exit.
  -u, --url URL                         backend url.
  -p, --port PORT                       listen port.
  -n, --dbname NAME                     mysql database name.
  -u, --dbuser USERNAME                 mysql user.
  -ju, --judgeurl URL                   url of judge.
  -vu, --vncproxyurl URL                url of vncproxy.
```

3. run `install.sh` with options

```bash
bash install.sh [options]
```

4. Set `/etc/nasajudgebackend/.env`

5. Restart it with systemd.
``` bash
systemctl restart nasajudgebackend.service
```

## Remove
### TODO