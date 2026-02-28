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
			//extract parameter
			adaptedPath := remote.Path
			for _, param := range parameters {
				parameterValue, ok := ctx.Params.Get(param)
				if !ok {
					ctx.JSON(http.StatusBadRequest, gin.H{"message": fmt.Sprintf("path param '%s' missing", param)})
					return
				}
				//replace
				adaptedPath = replaceWithParameter(adaptedPath, param, parameterValue)
			}
			req.Header = ctx.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = adaptedPath
			//fmt.Printf("adapted=%s from=%s\n", adaptedPath, req.URL.Path)
			//fmt.Printf("headers=%+v \n", req.Header)
			//fmt.Printf("ctx.headers=%+v \n", ctx.Request.Header)
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
	//fmt.Printf("remote=%s://%s%s\n", remote.Scheme, remote.Host, remote.Path)

	return func(ctx *gin.Context) {
		director := func(req *http.Request) {
			req.Header = ctx.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = remote.Path
			//fmt.Printf("adapted=%s from=%s\n", remote.Path, req.URL.Path)
			//fmt.Printf("remote=%s://%s%s\n", remote.Scheme, remote.Host, remote.Path)
			//fmt.Printf("headers=%+v \n", req.Header)
			//fmt.Printf("ctx.headers=%+v \n", ctx.Request.Header)
		}
		proxy := &httputil.ReverseProxy{
			Director: director,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			},
		}
		//fmt.Printf("forwarding...\n")
		proxy.ServeHTTP(ctx.Writer, ctx.Request)
	}
}

func replaceWithParameter(path string, parameter string, replacement string) string {
	return strings.Replace(path, fmt.Sprintf(":%s", parameter), replacement, 1)
}
