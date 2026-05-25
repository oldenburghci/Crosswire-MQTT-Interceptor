package handler

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib"
)

func SetSHHubToken() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token := serverlib.GATEWAY_CONFIG.SHH_TOKEN
		ctx.Request.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	}
}
