module user-management

go 1.23.4

require (
    github.com/gin-gonic/gin v1.10.0
    gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway v0.0.0
)

replace gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway => /src/gateway
replace gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/user-management => .
