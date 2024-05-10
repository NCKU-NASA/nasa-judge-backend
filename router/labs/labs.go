package labs
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/models/lab"
    "github.com/NCKU-NASA/nasa-judge-backend/models/user"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckSignIn, getlabs)
    //router.GET("/:labId/download/description", description)
    //router.GET("/:labId/download/:filename", download)
    //router.GET("/:labId/chart", chart)
}

func getlabs(c *gin.Context) {
    userdata, _ := c.Get("user")
    if userdata == nil {
        c.JSON(200, struct {
            Labs []lab.Lab `json:"labs"`
        } {
            Labs: []lab.Lab{},
        })
        return
    }
    labs := lab.GetLabs()

    for i := 0; i < len(labs); i++ {
        allow := labs[i].ContainPromission("all")
        if !allow {
            for _, group := range userdata.(user.User).Groups {
                allow = labs[i].ContainPromission(group.Groupname)
                if allow {
                    break
                }
            }
            if !allow {
                labs = append(labs[:i], labs[i+1:]...)
                i--
            }
        }
    }
    c.JSON(200, struct {
        Labs []lab.Lab `json:"labs"`
    } {
        Labs: labs,
    })
}
