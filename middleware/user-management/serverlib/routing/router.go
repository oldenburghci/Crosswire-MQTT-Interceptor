package routing

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	gatewaydb "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/db"
	gatewaytypes "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/utils"
	myauth "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/auth"
	mydb "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/db"
	mytypes "gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management/serverlib/types"
	"net/http"
	"net/mail"
	"slices"
)

type UserManagementServer struct {
	//Access to rbac/abac model that is persistently stored in the database
	AuthProvider mytypes.RBACModelPersistenceProvider
	//Access to the app resources to check for granular access
	ResourcesProvider gatewaytypes.ApplicationDataPersistenceProvider
	//ABAC/RBAC Enforcer
	AccessControlEnforcer *myauth.AccessControlEnforcer
	config                map[string]string
}

func NewUserManagementServer() (*UserManagementServer, error) {

	config := make(map[string]string)
	config["DB_HOST"] = gateway.GetFromEnvironment("DB_HOST")
	config["DB_PORT"] = gateway.GetFromEnvironment("DB_PORT")
	config["DB_USER"] = gateway.GetFromEnvironment("DB_USER")
	config["DB_PASSWD"] = gateway.GetFromEnvironment("DB_PASSWD")
	config["HOST"] = gateway.GetFromEnvironment("HOST")
	config["PORT"] = gateway.GetFromEnvironment("PORT")
	config["PASSWD_SALT"] = gateway.GetFromEnvironment("PASSWD_SALT")

	authProvider, err := mydb.NewPostgresAuthController(config)
	if err != nil {
		return nil, err
	}
	if err := authProvider.InitializeDatabaseExtension(); err != nil {
		return nil, err
	}

	resourcesProvider, err := gatewaydb.NewPostgresModelProvider(config)
	if err != nil {
		return nil, err
	}

	enforcer, err := myauth.NewAccessControlEnforcer(authProvider.GetCasbinAdapter())
	if err != nil {
		return nil, err
	}

	result := &UserManagementServer{
		AuthProvider:          authProvider,
		ResourcesProvider:     resourcesProvider,
		AccessControlEnforcer: enforcer,
		config:                config,
	}
	if err := result.initUsers(); err != nil {
		return nil, err
	}
	return result, nil
}

func (server *UserManagementServer) initUsers() error {
	admin := mytypes.User{
		Username: "admin",
		Password: "admin123",
		Email:    "admin@mail.com",
		Role: mytypes.Role{
			RoleName: "admin",
		},
	}
	//and one operator
	operator1 := mytypes.User{
		Username: "operator1",
		Password: "operator1",
		Email:    "operator@mail.com",
		Role: mytypes.Role{
			RoleName: "operator",
		},
	}
	// it might be, that the user management restarts and the errors prevent the startup if the users already exists
	//var u0, u1 *mytypes.User

	ad0, _ := server.AuthProvider.GetUser(admin.Username)
	ad1, _ := server.AuthProvider.GetUser(admin.Email)

	if ad0 == nil && ad1 == nil {
		if err := server.AuthProvider.CreateUser(&admin); err != nil {
			fmt.Printf("[WARNING] %+v\n", err)
			return err
		}
	}

	u0, _ := server.AuthProvider.GetUser(operator1.Username)
	u1, _ := server.AuthProvider.GetUser(operator1.Email)

	if u0 == nil && u1 == nil {
		if err := server.AuthProvider.CreateUser(&operator1); err != nil {
			fmt.Printf("[WARNING] %+v\n", err)
			return err
		}
	}
	return nil
}

func (server *UserManagementServer) Start() error {
	router := gin.Default()
	router.Use(
		myauth.SecurityHeaders(
			fmt.Sprintf("%s:%s",
				server.config["HOST"],
				server.config["PORT"],
			),
		),
	)
	//has to be without jwt validation
	router.POST("/login", server.LoginHandler)
	authGroup := router.Group("/auth")
	authGroup.Use(myauth.ValidateJWT())

	authGroup.GET("/ping", func(ctx *gin.Context) { ctx.JSON(http.StatusOK, gin.H{"msg": "pong"}) })
	authGroup.GET("/whoami", server.WhoAmIHandler)
	authGroup.PUT("/password", server.ChangePasswordHandler)
	authGroup.PUT("/user", server.ChangeUserInformation)

	authGroup.GET("/resource/:id", server.HasAccessToResource)
	authGroup.GET("/resources", server.GetAccessibleResources)

	authGroup.POST("/check-access", server.CheckAccessPolicy)
	//Only for test purposes, remove in "production"
	//redirect to the server's own auth route for one dedicated resource
	//authGroup.GET(
	//	"/test/:id/ping",
	//	myauth.RequestResourceAccess(
	//		fmt.Sprintf("https://%s:%s/auth/resource/:id", server.config["HOST"], server.config["PORT"]),
	//		"id",
	//	),
	//	func(ctx *gin.Context) { ctx.JSON(http.StatusOK, gin.H{"msg": "pong"}) },
	//)
	//Only for test purposes, remove in "production"
	//router.POST(
	//	"/middleware/api/memo/:id",
	//	myauth.ValidateJWT(),
	//	myauth.RequestAccessControlPolicyCheck(
	//		fmt.Sprintf("https://%s:%s/auth/check-access", server.config["HOST"], server.config["PORT"]),
	//	),
	//	myauth.RequestResourceAccess(
	//		fmt.Sprintf("https://%s:%s/auth/resource/:id", server.config["HOST"], server.config["PORT"]),
	//		"id",
	//	),
	//	func(ctx *gin.Context) {
	//		request := struct {
	//			Text string `json:"text" binding:"required"`
	//		}{}
	//		if err := ctx.ShouldBindJSON(&request); err != nil {
	//			fmt.Printf("[ERROR] %+v\n", err)
	//			ctx.JSON(http.StatusBadRequest, gin.H{"msg": "error", "detail": err.Error()})
	//			return
	//		}
	//		ctx.JSON(http.StatusOK, gin.H{"msg": "ok", "original": request})
	//	},
	//)
	//Only for test purposes, remove in "production"
	//redirect to the server's own auth route for all available resources
	//authGroup.GET(
	//	"/tests/ping",
	//	myauth.RequestResourcesAccess(
	//		fmt.Sprintf("https://%s:%s/auth/resources", server.config["HOST"], server.config["PORT"]),
	//	),
	//	func(ctx *gin.Context) {
	//		resources, _ := ctx.Get("resources")
	//		fmt.Printf("[Pong] resources=%+v\n", resources)
	//		ctx.JSON(http.StatusOK, gin.H{
	//			"msg":       "pong",
	//			"resources": resources,
	//		})
	//	},
	//)
	////For test purposes only
	//authGroup.POST(
	//	"test/access/ping",
	//	myauth.RequestAccessControlPolicyCheck(
	//		fmt.Sprintf("https://%s:%s/auth/check-access", server.config["HOST"], server.config["PORT"]),
	//	),
	//	func(ctx *gin.Context) { ctx.JSON(http.StatusOK, gin.H{"msg": "pong"}) },
	//)

	err := router.RunTLS(
		fmt.Sprintf("%s:%s",
			server.config["HOST"],
			server.config["PORT"],
		),
		"./config/certs/cert.pem",
		"./config/certs/key.pem",
	)
	return err
}

func (server *UserManagementServer) WhoAmIHandler(ctx *gin.Context) {
	response := struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}{}
	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	user, err := server.AuthProvider.GetUserByID(uid)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	response.Username = user.Username
	response.Email = user.Email

	ctx.JSON(http.StatusOK, response)
}

func (server *UserManagementServer) ChangePasswordHandler(ctx *gin.Context) {
	var req struct {
		CurrentPassword string `json:"currentPassword" binding:"required,min=8,max=48"`
		NewPassword     string `json:"newPassword" binding:"required,min=8,max=48"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}

	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	user, err := server.AuthProvider.GetUserByID(uid)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}

	//if len(req.NewPassword) >= 48 {
	//	ctx.JSON(http.StatusBadRequest, gin.H{"message": "A password can only be 48 characters long"})
	//	return
	//}

	if req.NewPassword == req.CurrentPassword {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "The new password cannot be the same as the current password."})
		return
	}

	//the ComparePassword method has a convenient function in it such that a plain text password is hashed and compared
	// which allows the user to omit hashing
	if isTrue := utils.ComparePassword(user.Password, req.CurrentPassword+server.config["PASSWD_SALT"]); !isTrue {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "wrong password"})
		return
	}

	passwd := req.NewPassword + server.config["PASSWD_SALT"]
	utils.HashPassword(&passwd)
	user.Password = passwd

	if err := server.AuthProvider.UpdateUser(user); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (server *UserManagementServer) LoginHandler(ctx *gin.Context) {
	user := mytypes.User{}

	if err := ctx.ShouldBindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	//we assume that the client has sent an email or username in the username field (as we provide this feature)
	username := user.Username
	_, err := mail.ParseAddress(username)
	var dbUser *mytypes.User
	if err == nil {
		//username is a mail, identifying is easy
		dbUser, err = server.AuthProvider.GetUser(username)
	} else {
		dbUsers, err := server.AuthProvider.GetUsersByUsernames([]string{username})
		if err != nil {
			fmt.Printf("Error getting users: %v\n", err)
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "no such user"})
			return
		}
		//name is ambiguous, how could this happen??
		if len(dbUsers) > 1 {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "try email"})
			return
		}
		dbUser = dbUsers[0]
	}
	//TODO: Check if the user is currently suspended
	//fmt.Printf("dbUser: %+v\n", dbUser)
	if dbUser == nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "no such user"})
		return

	}
	//the ComparePassword method has a convenient function in it such that a plain text password is hashed and compared
	// which allows the user to omit hashing
	if isTrue := utils.ComparePassword(dbUser.Password, user.Password+server.config["PASSWD_SALT"]); isTrue {
		token := utils.GenerateToken(dbUser.ID)
		ctx.JSON(http.StatusOK, gin.H{"message": "success", "token": token})
		return
	}
	ctx.JSON(http.StatusUnauthorized, gin.H{"message": "wrong password"})
	return
}

func (server *UserManagementServer) LogoutHandler(ctx *gin.Context) {}

func (server *UserManagementServer) ChangeUserInformation(ctx *gin.Context) {
	request := struct {
		Username string `json:"username" binding:"required,min=3,max=20"`
		Email    string `json:"email" binding:"required,email"`
	}{}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}

	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	dbUser, err := server.AuthProvider.GetUserByID(uid)
	//check if update possible
	usermail, err := mail.ParseAddress(request.Email)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "no valid email address"})
		return
	}

	dbUser.Username = request.Username
	dbUser.Email = usermail.Address
	if err := server.AuthProvider.UpdateUser(dbUser); err != nil {
		fmt.Printf("Error updating user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "the user could not be updated due to a name conflict."})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "user successfully updated"})
}

// HasAccessToResource is a handler function that checks if the user has access to resource x. The resource key is
// extracted from the route's path.
func (server *UserManagementServer) HasAccessToResource(ctx *gin.Context) {
	resourceId := ctx.Param("id")
	if resourceId == "" {
		fmt.Printf("Error getting resource id from request path\n")
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "resource id is required"})
		return
	}
	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	resources, err := server.ResourcesProvider.GetAccessibleResources(uid)
	if err != nil {
		fmt.Printf("Error getting resources: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	if isIn := slices.Contains(resources, resourceId); !isIn {
		ctx.JSON(http.StatusUnauthorized, gin.H{"message": "denied"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "granted"})
}

func (server *UserManagementServer) GetAccessibleResources(ctx *gin.Context) {
	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	resources, err := server.ResourcesProvider.GetAccessibleResources(uid)
	if err != nil {
		fmt.Printf("Error getting resources: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"resources": resources})
}

func (server *UserManagementServer) CheckAccessPolicy(ctx *gin.Context) {
	request := struct {
		FullPath string `json:"fullPath,required"`
		Method   string `json:"method,required"`
	}{}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		fmt.Printf("Error getting request: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}
	fmt.Printf("in auth enforcer. request: %v\n", request)

	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	user, err := server.AuthProvider.GetUserByID(uid)
	if err != nil {
		fmt.Printf("Error getting user: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	pass, err := server.AccessControlEnforcer.RBACEnforcer.Enforce(user.Role.RoleName, request.FullPath, request.Method)
	if err != nil {
		fmt.Printf("Error checking access policy: %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
		return
	}
	if !pass {
		ctx.JSON(http.StatusForbidden, gin.H{"message": "denied"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "granted"})
}
