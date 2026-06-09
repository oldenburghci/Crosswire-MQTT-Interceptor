package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func PongHandler(ctx *gin.Context) {
	response := gin.H{
		"message": "pong",
	}

	ctx.JSON(http.StatusOK, response)
	return
}
