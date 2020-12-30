# Local Development

## Requirements

- docker v20.10. Required for host.docker.internal on UNIX systems
- kind v0.9.0
- yarn v1.22.10
- make v4.1

## Limitations

- backend doesn't serve react bundle
- backend doesn't support basic auth 

## How to start

```shell script
make development-start
```shell script
```

Please note that the frontend container will install node_modules after the boot, so it could take some time to spin completely

## Teardown

```shell script
make development-down
```


