package utils

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
)

// GetUserIDFromContext extracts the UserID from the current context. If there is no UserID found, the function returns
// an internal server error to the client and returns an invalid UserID and an error to the method's caller.
func GetUserIDFromContext(ctx *gin.Context) (uint, error) {
	userID, ok := ctx.Get("userID")
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return 0, errors.New("No userID in a valid JWT token")
	}
	return uint(userID.(float64)), nil
}
