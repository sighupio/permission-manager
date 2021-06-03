package server


type ErrorRes struct {
	Error string `json:"error"`
}

type OkRes struct {
	Ok bool `json:"ok"`
}

