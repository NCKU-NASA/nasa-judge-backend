package judge
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.POST("/", auth.CheckSignIn, judge)
    router.GET("/canjudge", auth.CheckSignIn, canjudge)
}

func status(c *gin.Context) {
    c.String(200, "test2")
}
