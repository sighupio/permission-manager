package server

import "testing"

func Test_isValidUsername(t *testing.T) {
	tests := []struct {
		name     string
		username string
		isValid  bool
	}{
		{name: "valid username", username: "gino", isValid: true},
		{name: "valid username with digest", username: "gino1", isValid: true},
		{name: "valid username from error message", username: "gino.mycompany", isValid: true},
		{name: "not valid username (has upper symbol)", username: "Gino Mycompany", isValid: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotValid := isValidUsername(tt.username); gotValid != tt.isValid {
				t.Errorf("isValidUsername() = %v, want %v", gotValid, tt.isValid)
			}
		})
	}
}
