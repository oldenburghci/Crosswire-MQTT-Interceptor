package auth

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/utils"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
)

// RequestResourceAccess is a middleware that forwards a request to the user management component.
// The component checks if this user has access to the requested resource. If true, the request chain proceeds.
// If the access is denied, the request chain is aborted. Use this middleware to request access to one resource.
func RequestResourceAccess(remoteURL string, parameters ...string) gin.HandlerFunc {
	remote, err := url.Parse(remoteURL)
	fmt.Printf("remote url is %s\n", remote)
	if err != nil {
		panic(err)
	}
	return func(ctx *gin.Context) {
		if err != nil {
			fmt.Printf("error=%v\n", err)
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}
		response, err := prepareRequest(ctx, remote, "GET", nil, parameters...)
		if err != nil {
			//no response to the client required. The helper function does it on its own.
			fmt.Printf("error=%v\n", err)
			return
		}
		response.Body.Close()
		//no access
		if response.StatusCode == http.StatusUnauthorized {
			ctx.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		//malformed
		if response.StatusCode == http.StatusBadRequest {
			ctx.AbortWithStatus(http.StatusBadRequest)
			return
		}
		// all other errors
		if response.StatusCode == http.StatusInternalServerError {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		if response.StatusCode != http.StatusOK {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		// passed the resource check
	}
}

// RequestResourcesAccess is a middleware that forwards a request to the user management component.
// The component checks the resources the user has access to. A successful request yields a "resources" field
// that is set into the current context for further processing. Place keep in mind, that the resources are not separated
// into classes (e.g. memos or configurations).
func RequestResourcesAccess(remoteURL string, parameters ...string) gin.HandlerFunc {
	remote, err := url.Parse(remoteURL)
	fmt.Printf("remote url is %s\n", remote)
	if err != nil {
		panic(err)
	}
	return func(ctx *gin.Context) {
		if err != nil {
			fmt.Printf("error=%v\n", err)
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}
		response, err := prepareRequest(ctx, remote, "GET", nil, parameters...)
		if err != nil {
			//no response to the client required. The helper function does it on its own.
			fmt.Printf("error=%v\n", err)
			return
		}
		//handle response error codes
		// the intended route returns only 500 or 200. A default (e.g. for 404) should also be present for unintended use
		if response.StatusCode != http.StatusOK {
			fmt.Printf("remote status code is %d, return 500 to client\n", response.StatusCode)
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		//parse response
		resources := struct {
			Resources []string
		}{}

		body, _ := ioutil.ReadAll(response.Body)
		response.Body.Close()
		if err := json.Unmarshal(body, &resources); err != nil {
			fmt.Printf("parsing error=%v\n", err)
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		//set resources to context
		ctx.Set("resources", resources.Resources)
	}
}

func replaceWithParameter(path string, parameter string, replacement string) string {
	return strings.Replace(path, fmt.Sprintf(":%s", parameter), replacement, 1)
}

func prepareRequest(ctx *gin.Context, remote *url.URL, method string, body *bytes.Buffer, parameters ...string) (*http.Response, error) {
	// check if a valid uid has been deduced from the token and set in the context
	_, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return nil, err
	}
	// get parameters
	adaptedPath := remote.Path
	for _, param := range parameters {
		parameterValue, ok := ctx.Params.Get(param)
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": fmt.Sprintf("path param '%s' missing", param)})
			return nil, fmt.Errorf("path param '%s' missing", param)
		}
		//replace
		adaptedPath = replaceWithParameter(adaptedPath, param, parameterValue)
	}

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	// set body explicitly to nil to avoid an error in the NewRequest() call
	var request *http.Request
	if body != nil {
		request, err = http.NewRequest(
			method,
			fmt.Sprintf("%s://%s%s", remote.Scheme, remote.Host, adaptedPath),
			body,
		)
	} else {
		request, err = http.NewRequest(
			method,
			fmt.Sprintf("%s://%s%s", remote.Scheme, remote.Host, adaptedPath),
			nil,
		)
	}
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return nil, err
	}
	//forward the provided auth (token)
	request.Header.Add("Authorization", ctx.GetHeader("Authorization"))

	client := &http.Client{Transport: tr}
	response, err := client.Do(request)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return nil, err
	}
	return response, nil
}

func RequestAccessControlPolicyCheck(remoteURL string) gin.HandlerFunc {
	remote, err := url.Parse(remoteURL)
	if err != nil {
		panic(err)
	}
	return func(ctx *gin.Context) {
		// it appears that as soon as a context is bound (e.g. through ShouldBind(...) method) it is also consumed and
		// cannot be used again in consecutive requests or handler which yields an invalid request parsing result
		request := struct {
			FullPath string `json:"fullPath,required"`
			Method   string `json:"method,required"`
		}{
			FullPath: ctx.FullPath(),
			Method:   ctx.Request.Method,
		}

		fmt.Printf("received request %v\n", request)

		marshaled, err := json.Marshal(&request)
		if err != nil {
			fmt.Printf("error=%v\n", err)
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
			return
		}

		response, err := prepareRequest(ctx, remote, "POST", bytes.NewBuffer(marshaled))
		if err != nil {
			fmt.Printf("error=%v\n", err)
			return
		}
		if response.StatusCode == http.StatusUnauthorized {
			ctx.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		if response.StatusCode == http.StatusForbidden {
			ctx.AbortWithStatus(http.StatusForbidden)
			return
		}
		// fallback
		if response.StatusCode != http.StatusOK {
			fmt.Printf("remote status code is %d, return 500 to client\n", response.StatusCode)
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		response.Body.Close()
		ctx.Next()
	}
}

// ValidateJWT validates a jwt token. Requires the environment variable JWT_SECRET.
// An incoming request most provide a valid jwt token to be approved as authentic entity.
func ValidateJWT() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		const BearerSchema string = "Bearer "
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "No Authorization header found",
				},
			)
			return
		}
		tokenString := authHeader[len(BearerSchema):]

		if token, err := utils.ValidateToken(tokenString); err != nil {
			ctx.AbortWithStatusJSON(
				http.StatusUnauthorized,
				gin.H{
					"error": "No Valid Token",
				},
			)
			return
		} else {
			if claims, ok := token.Claims.(jwt.MapClaims); !ok {
				ctx.AbortWithStatus(http.StatusUnauthorized)
			} else {
				if token.Valid {
					ctx.Set("userID", claims["userID"])
				} else {
					ctx.AbortWithStatus(http.StatusUnauthorized)
				}
			}
		}
	}
}

func SecurityHeaders(acceptHost string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Header("X-Frame-Options", "DENY")
		ctx.Header("Content-Security-Policy", "default-src 'self'; connect-src *; font-src *; script-src-elem * 'unsafe-inline'; img-src * data:; style-src * 'unsafe-inline';")
		ctx.Header("X-XSS-Protection", "1; mode=block")
		ctx.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		ctx.Header("Referrer-Policy", "strict-origin")
		ctx.Header("X-Content-Type-Options", "nosniff")
		ctx.Header("Permissions-Policy", "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()")
		ctx.Next()
	}
}
