package passwd
import (
    "encoding/json"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/sessions"

    confirmtype "github.com/NCKU-NASA/nasa-judge-lib/enum/confirm_type"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"

    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
    "github.com/NCKU-NASA/nasa-judge-backend/models/confirm"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r

    router.POST("/forget", forget)
    router.GET("/check", check)
    router.POST("/change", change)
}

func forget(c *gin.Context) {
    var userdata user.User
    err := c.ShouldBindJSON(&userdata)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    userdata = user.User{
        Email: userdata.Email,
    }
    userdata.Fix()
    if userdata.Email == "" {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 400,
            Msg: "Email can't be empty.",
        })
    }
    userdata, err = user.GetUser(userdata)
    if err != nil {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 409,
            Msg: "Email not exist",
        })
    }
    err = confirm.Push(confirmtype.ForgetPassword, userdata.Email, userdata)
    if err != nil {
        errutil.AbortAndError(c, err.(*errutil.Err))
        return
    }
    c.String(200, "Confirm mail sent.")
}

func check(c *gin.Context) {
    session := sessions.Default(c)
    token := session.Get("token")
    if token == nil {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "Bad token",
        })
        return
    }
    confirmdata, err := confirm.Pop(token.(string))
    if err != nil || confirmdata.Type != confirmtype.ForgetPassword {
        session.Delete("token")
        session.Save()
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "Bad token",
        })
        return
    }
    err = confirm.PushBack(token.(string), confirmdata)
    if err != nil {
        errutil.AbortAndError(c, err.(*errutil.Err))
        return
    }
    c.JSON(200, true)
}

func change(c *gin.Context) {
    var newpass user.User
    err := c.ShouldBindJSON(&newpass)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    newpass = user.User{
        Password: newpass.Password,
    }
    session := sessions.Default(c)
    token := session.Get("token")
    if token == nil {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "Bad token",
        })
        return
    }
    confirmdata, err := confirm.Pop(token.(string))
    session.Delete("token")
    session.Save()
    if err != nil || confirmdata.Type != confirmtype.ForgetPassword {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "Bad token",
        })
        return
    }
    var userdata user.User
    err = json.Unmarshal(confirmdata.Data, &userdata)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    userdata.Fix()
    userdata.Password = newpass.Password
    err = userdata.Update()
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    c.String(200, "Success")
}
