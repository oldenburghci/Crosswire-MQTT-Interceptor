module gateway

go 1.23.4

require (
	gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management v0.0.0
	github.com/casbin/casbin/v2 v2.103.0
	github.com/gin-gonic/gin v1.10.0
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/google/uuid v1.6.0
	golang.org/x/crypto v0.35.0
	gorm.io/datatypes v1.2.5
	gorm.io/driver/postgres v1.5.11
	gorm.io/gorm v1.25.12
)

replace gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management => /src/user-management
replace gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway => .