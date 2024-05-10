package score
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckSignIn, getscores)
    router.GET("/:labId", auth.CheckSignIn, getlabscore)
}

func status(c *gin.Context) {
    c.String(200, "test2")
}
