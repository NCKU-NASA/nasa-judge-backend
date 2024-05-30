package router
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/apis/judge"
    "github.com/NCKU-NASA/nasa-judge-backend/router/user"
    "github.com/NCKU-NASA/nasa-judge-backend/router/labs"
    "github.com/NCKU-NASA/nasa-judge-backend/router/score"
    judgeroute "github.com/NCKU-NASA/nasa-judge-backend/router/judge"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r

    router.GET("/pubkey", pubkey)

    user.Init(router.Group("/user"))
    labs.Init(router.Group("/labs"))
    score.Init(router.Group("/score"))
    judgeroute.Init(router.Group("/judge"))
}

func pubkey(c *gin.Context) {
    judge.Pubkey(c)
}
