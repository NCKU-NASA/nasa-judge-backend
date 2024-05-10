package main
import (
//    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/sessions"
    "github.com/gin-contrib/sessions/gorm"
    "github.com/go-errors/errors"

    "github.com/NCKU-NASA/nasa-judge-backend/router"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/redis"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/database"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
)

func main() {
    defer redis.Close()
    if !config.Debug {
        gin.SetMode(gin.ReleaseMode)
    }
    store := gorm.NewStore(database.GetDB(), true, []byte(config.Secret))
    backend := gin.Default()
    backend.Use(errorHandler)
    backend.Use(gin.CustomRecovery(panicHandler))
    backend.Use(sessions.Sessions(config.Sessionname, store))
    backend.Use(auth.AddMeta)
    router.Init(&backend.RouterGroup)
    backend.Run(":"+string(config.Port))
}

func panicHandler(c *gin.Context, err any) {
    goErr := errors.Wrap(err, 2)
    errmsg := ""
    if config.Debug {
        errmsg = goErr.Error()
    }
    errutil.AbortAndError(c, &errutil.Err{
        Code: 500,
        Msg: "Internal server error",
        Data: errmsg,
    })
}

func errorHandler(c *gin.Context) {
    c.Next()

    for _, e := range c.Errors {
        err := e.Err
        if myErr, ok := err.(*errutil.Err); ok {
            if myErr.Msg != nil {
                if config.Debug {
                    c.JSON(myErr.Code, myErr.ToH())
                } else {
                    c.String(myErr.Code, myErr.Msg.(string))
                }
            } else {
                c.Status(myErr.Code)
            }
        } else {
            if config.Debug {
                c.JSON(500, gin.H{
                    "code": 500,
                    "msg": "Internal server error",
                    "data": err.Error(),
                })
            } else {
                c.String(500, "Internal server error")
            }
        }
        return
    }
}
