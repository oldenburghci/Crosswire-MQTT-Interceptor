package proxy

import (
	"crypto/tls"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func ForwardWithParameters(target string, parameters ...string) gin.HandlerFunc {
	remote, err := url.Parse(target)
	if err != nil {
		panic(err)
	}
	return func(ctx *gin.Context) {
		director := func(req *http.Request) {
			adaptedPath := remote.Path
			for _, param := range parameters {
				parameterValue, ok := ctx.Params.Get(param)
				if !ok {
					ctx.JSON(http.StatusBadRequest, gin.H{"message": fmt.Sprintf("path param '%s' missing", param)})
					return
				}
				adaptedPath = replaceWithParameter(adaptedPath, param, parameterValue)
			}
			req.Header = ctx.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = adaptedPath
		}
		proxy := &httputil.ReverseProxy{Director: director}
		proxy.ServeHTTP(ctx.Writer, ctx.Request)
	}
}

func ForwardHandler(target string) gin.HandlerFunc {
	remote, err := url.Parse(target)
	if err != nil {
		panic(err)
	}

	return func(ctx *gin.Context) {
		director := func(req *http.Request) {
			req.Header = ctx.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = remote.Path
		}
		proxy := &httputil.ReverseProxy{
			Director: director,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			},
		}
		proxy.ServeHTTP(ctx.Writer, ctx.Request)
	}
}

func replaceWithParameter(path string, parameter string, replacement string) string {
	return strings.Replace(path, fmt.Sprintf(":%s", parameter), replacement, 1)
}
