package server

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUsernameValidation(t *testing.T) {
	assert.True(t, isValidUsername("gino"))
	assert.True(t, isValidUsername("gino-pino"))
	assert.False(t, isValidUsername("gino@pino"))
	assert.True(t, isValidUsername("gino.pino"))
	assert.False(t, isValidUsername("Gino"))
}
