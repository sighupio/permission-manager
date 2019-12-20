package config

type Config struct {
	ClusterName                string
	ClusterControlPlaceAddress string
}

func New() *Config {
	return &Config{}
}
