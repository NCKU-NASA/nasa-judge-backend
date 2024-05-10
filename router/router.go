package router
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/router/user"
    "github.com/NCKU-NASA/nasa-judge-backend/router/labs"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r

    router.GET("/pubkey", pubkey)

    user.Init(router.Group("/user"))
    labs.Init(router.Group("/labs"))
}

func pubkey(c *gin.Context) {
    c.String(200, "test2")
}
