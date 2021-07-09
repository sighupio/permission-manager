package server

type ErrorRes struct {
	Error string `json:"error"`
}

// OkRes to deprecate. No reason in sending this struct, there is already HTTP Code 2xx for that
type OkRes struct {
	Ok bool `json:"ok"`
}
