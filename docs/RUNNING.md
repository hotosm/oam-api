# RUNNING


## Build docker images


```
$ cd ~/oam-api
$ docker-compose -f docker-compose-production.yml build
```

This should build a set of docker images 


## Bring the containers up 

To bring up the containers, run docker-compose up

```
$ cd ~/oam-api
$ docker-compose -f docker-compose-production.yml up -d
```

This should bring up five containers:

```
ubuntu@ip-172-31-63-232:~/oam-catalog$ docker ps -a
CONTAINER ID        IMAGE                   COMMAND                  CREATED             STATUS                         PORTS                              NAMES
c907c09834aa        oamcatalog_transcoder   "nodemon bin/trans..."   About an hour ago   Up About an hour               4000/tcp                           oamcatalog_transcoder_1
6b90ec58295b        oamcatalog_worker       "nodemon catalog-w..."   About an hour ago   Up About an hour               4000/tcp                           oamcatalog_worker_1
a3b865480793        oamcatalog_api          "node index.js"          About an hour ago   Up About an hour               0.0.0.0:4000->4000/tcp             oamcatalog_api_1
8f408c18a578        oamcatalog_register     "http-server test/"      About an hour ago   Up About an hour               4000/tcp, 0.0.0.0:8080->8080/tcp   oamcatalog_register_1
9fa9b5365c44        oamcatalog_app          "false"                  About an hour ago   Exited (1) About an hour ago                                      oamcatalog_app_1
d6b361516b2b        mongo:3                 "docker-entrypoint..."   About an hour ago   Up About an hour               27017/tcp                          oamcatalog_mongo_1
```

The API container listens on port 4000 which needs to be reverse proxied by nginx. `oamcatalog_app` failing seems to be normal.

```
$ sudo apt-get install nginx
$ cat /etc/nginx/conf.d/oam-api.conf
upstream uploader_nodes {
    ip_hash;
    server 0.0.0.0:4000;
}

# REWRITE TO HTTPS BLOCK HIDDEN

server {
    listen 443;
    server_name api.openaerialmap.org;

    ssl on;
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/certs/server.key;
    #enables all versions of TLS, but not SSLv2 or 3 which are weak and now deprecated.
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    #Disables all weak ciphers
    ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";

    ssl_prefer_server_ciphers on;

    location / {
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header   X-Real-IP            $remote_addr;

        ## PASS TO UPSTREAM uploader_nodes
        proxy_pass http://uploader_nodes;
    }
}
```

Nginx proxies the API service running on localhost to the world. Note:
Cloudflare fronts the service and protects the API server from common attacks.

## Test

```
$ sudo systemctl start nginx
$ sleep 10
$ nc -zv localhost 80
Connection to localhost 80 port [tcp/http] succeeded!
$ nc -zv localhost 443
Connection to localhost 443 port [tcp/https] succeeded!
```


## TODO:

1. Make building faster by changing ubuntu repository url to `http://us-east-1.ec2.archive.ubuntu.com`
2. Upgrade Node from v6 to v10 (dev effort needed)
3. Document CloudFlare DNS configuration
4. Update API documentation: https://docs.openaerialmap.org/uploader/api-server/

