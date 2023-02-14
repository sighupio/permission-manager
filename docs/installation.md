# Installation

 [provided Helm Chart](/helm_chart).

First create a values file, for example `my-values.yaml`, with your custom values for the release. See the [chart's readme](/helm_chart/README.md) and the [default values.yaml](/helm_chart/values.yaml) for more information.

Then, execute:

```bash
helm repo add permission-manager https://sighupio.github.io/permission-manager
helm upgrade --install --namespace permission-manager --set image.tag=v1.8.0 --values my-values.yaml permission-manager permission-manager/permission-manager
```

> don't forget to replace `my-values.yaml` with the path to your values file.

