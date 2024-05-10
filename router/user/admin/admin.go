package admin
import (
    "github.com/gin-gonic/gin"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    
    //router.GET("/appendtogroup", auth.CheckIsAdmin, appendtogroup)
    //router.GET("/removefromgroup", auth.CheckIsAdmin, removefromgroup)
    //router.GET("/alluserdata", auth.CheckIsAdmin, alluserdata)
    //router.POST("/userdata", auth.CheckIsAdmin, userdata)
}

