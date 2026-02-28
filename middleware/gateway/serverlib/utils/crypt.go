package utils

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"golang.org/x/crypto/bcrypt"
	"time"
)

var JWT_SECRET string

func init() {
	JWT_SECRET = gateway.GetFromEnvironment("JWT_SECRET")
	//fmt.Println("JWT_SECRET:", JWT_SECRET)
}

// took from
//https://articles.wesionary.team/authorization-in-golang-projects-using-casbin-f8fad744dae5
//https://gist.github.com/dipeshhkc/269513d0adc49d6e4ada5dda68864e3a#file-casbin-jwt-utils-go

func HashPassword(pass *string) {
	bytePass := []byte(*pass)
	hPass, _ := bcrypt.GenerateFromPassword(bytePass, bcrypt.DefaultCost)
	*pass = string(hPass)
}

func ComparePassword(dbPass, pass string) bool {
	return bcrypt.CompareHashAndPassword([]byte(dbPass), []byte(pass)) == nil
}

// GenerateToken -> generates a jwt token
func GenerateToken(userid uint) string {
	claims := jwt.MapClaims{
		"exp":    time.Now().Add(time.Hour * 3).Unix(),
		"iat":    time.Now().Unix(),
		"userID": userid,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, _ := token.SignedString([]byte(JWT_SECRET))
	return t

}

// ValidateToken --> validate the given jwt token
func ValidateToken(token string) (*jwt.Token, error) {

	//2nd arg function return secret key after checking if the signing method is HMAC and returned key is used by 'Parse' to decode the token)
	return jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			//nil secret key
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(JWT_SECRET), nil
	})
}
