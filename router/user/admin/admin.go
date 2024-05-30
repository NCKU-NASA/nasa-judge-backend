package admin
import (
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    
    router.POST("/userdata", auth.CheckIsAdmin, userdata)
    router.GET("/alluserdata", auth.CheckIsAdmin, alluserdata)
    router.GET("/group/:method", auth.CheckIsAdmin, setgroup)
}

func userdata(c *gin.Context) {
    var nowuserdata user.User
    err := c.ShouldBindJSON(&nowuserdata)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    nowuserdata.Fix()
    nowuserdata, err = user.GetUser(nowuserdata)
    if err != nil {
        errutil.AbortAndStatus(c, 409)
        return
    }
    c.JSON(200, nowuserdata)
}

func alluserdata(c *gin.Context) {
    userdatas, err := user.GetUsers()
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    c.JSON(200, userdatas)
}

func setgroup(c *gin.Context) {
    method := c.Param("method")
    if method != "add" || method != "remove" {
        errutil.AbortAndStatus(c, 404)
        return
    }
    if c.Query("group") == "" {
        errutil.AbortAndStatus(c, 400)
        return
    }
    userdata := user.User{
        Username: c.Query("username"),
        StudentId: c.Query("studentId"),
        Email: c.Query("email"),
    }
    userdata.Fix()
    if userdata.Username == "" && userdata.StudentId == "" && userdata.Email == "" {
        errutil.AbortAndStatus(c, 400)
        return
    }
    userdata, err := user.GetUser(userdata)
    if err != nil {
        errutil.AbortAndStatus(c, 409)
        return
    }
    switch method {
    case "add":
        if !userdata.ContainGroup(c.Query("group")) {
            userdata.Groups = append(userdata.Groups, &user.Group{Groupname: c.Query("group")})
        }
    case "remove":
        for idx, nowgroup := range userdata.Groups {
            if nowgroup.Groupname == c.Query("group") {
                userdata.Groups = append(userdata.Groups[:idx], userdata.Groups[idx+1:]...)
                break
            }
        }
    default:
        errutil.AbortAndStatus(c, 404)
        return
    }
    err = userdata.Update()
    if err != nil {
        errutil.AbortAndStatus(c, 500)
    }
    c.String(200, "Success")
}

