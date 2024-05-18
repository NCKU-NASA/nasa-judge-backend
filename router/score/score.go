package score
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    //router.GET("/", auth.CheckSignIn, getscores)
    router.GET("/:labId", auth.CheckSignIn, getlabscore)
}

func getlabscore(c *gin.Context) {
    //labId := c.Param("labId")
    c.JSON(200, struct {
        Score int `json:"score"`
        DoCount int `json:"docount"`
        PassCount int `json:"passcount"`
    } {})
}
