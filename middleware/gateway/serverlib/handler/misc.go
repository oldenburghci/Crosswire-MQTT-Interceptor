package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func PongHandler(ctx *gin.Context) {
	//userId, exists := ctx.Get("userID")
	response := gin.H{
		"message": "pong",
	}

	//if exists {
	//	response["userID"] = userId
	//}

	ctx.JSON(http.StatusOK, response)
	return
}
