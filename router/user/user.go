package user
import (
    "strings"
    "encoding/json"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/sessions"

    confirmtype "github.com/NCKU-NASA/nasa-judge-backend/enum/confirm_type"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/models/user"
    "github.com/NCKU-NASA/nasa-judge-backend/models/confirm"
    "github.com/NCKU-NASA/nasa-judge-backend/router/user/passwd"
    "github.com/NCKU-NASA/nasa-judge-backend/router/user/admin"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckSignIn, getuser)
    router.GET("/issignin", auth.CheckSignIn, issignin)
    router.POST("/login", login)
    router.POST("/add", add)
    router.POST("/token", auth.CheckSignIn, token)
    router.GET("/confirm/:token", onconfirm)
    //router.GET("/config", config)

    passwd.Init(router.Group("/passwd"))
    admin.Init(router.Group("/admin"))
}

type userresult struct {
    Username string `json:"username"`
    StudentId string `json:"studentId"`
    Email string `json:"email"`
    Groups []*user.Group `json:"groups"`
}

func getuser(c *gin.Context) {
    userdata, _ := c.Get("user")
    result := userresult{
        Username: userdata.(user.User).Username,
        StudentId: userdata.(user.User).StudentId,
        Email: userdata.(user.User).Email,
        Groups: userdata.(user.User).Groups,
    }
    c.JSON(200, result)
}

func issignin(c *gin.Context) {
    result, _ := c.Get("isSignIn")
    c.JSON(200, result.(bool))
}

func login(c *gin.Context) {
    isAdmin, _ := c.Get("isAdmin")
    var userpost struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    err := c.ShouldBindJSON(&userpost)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    userdata := user.User{
        Username: userpost.Username,
    }
    userdata.Fix()
    if userdata.Username == "" || (userpost.Password == "" && (isAdmin == nil || !isAdmin.(bool))) {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "username or password incorrect",
        })
        return
    }
    userdata, err = user.GetUser(userdata)
    if err != nil || (!userdata.Password.Verify(userpost.Password) && (userpost.Password != "" || isAdmin == nil || !isAdmin.(bool))) {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 401,
            Msg: "username or password incorrect",
        })
        return
    }
    session := sessions.Default(c)
    session.Set("user", userdata.Username)
    session.Save()
    c.String(200, "Login success")
}

func add(c *gin.Context) {
    var userdata user.User
    err := c.ShouldBindJSON(&userdata)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    userdata = user.User{
        Username: userdata.Username,
        Password: userdata.Password,
        StudentId: userdata.StudentId,
        Email: userdata.Email,
    }
    userdata.Fix()
    if userdata.Username == "" || userdata.Password == "" || userdata.Email == "" {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 400,
            Msg: "Username, Password and Email can't be empty.",
        })
        return
    }
    querystr := "username = ? or email = ?"
    queryparem := []any{userdata.Username, userdata.Email}
    if userdata.StudentId != "" {
        querystr += " or student_id = ?"
        queryparem = append(queryparem, userdata.StudentId)
    }
    _, err = user.GetUser(querystr, queryparem...)
    if err == nil {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 409,
            Msg: "Username, StudentId or Email exist",
        })
        return
    }
    emailpart := strings.Split(userdata.Email, "@")
    if userdata.StudentId != "" && (emailpart[0] != userdata.StudentId || emailpart[1] != config.StudentEmailDomain) {
        errutil.AbortAndError(c, &errutil.Err{
            Code: 400,
            Msg: "Invail Email or StudentId",
        })
        return
    }
    err = confirm.Push(confirmtype.NewAccount, userdata.Email, userdata)
    if err != nil {
        errutil.AbortAndError(c, err.(*errutil.Err))
        return
    }
    c.String(200, "Confirm mail sent.")
}

func token(c *gin.Context) {
    userdata, _ := c.Get("user")
    var data struct {
        Data string `json:"data"`
    }
    err := c.ShouldBindJSON(&data)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    tokenstr, err := userdata.(user.User).GenToken(data.Data)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    c.JSON(200, tokenstr)
}

func onconfirm(c *gin.Context) {
    token := c.Param("token")
    confirmdata, err := confirm.Pop(token)
    if err != nil {
        errutil.AbortAndError(c, err.(*errutil.Err))
        return
    }
    switch confirmdata.Type {
    case confirmtype.NewAccount:
        var userdata user.User
        err = json.Unmarshal(confirmdata.Data, &userdata)
        if err != nil {
            errutil.AbortAndStatus(c, 500)
            return
        }
        userdata.Fix()
        userdata.Groups = []*user.Group{&user.Group{Groupname: "guest"}}
        err = userdata.Create()
        if err != nil {
            errutil.AbortAndStatus(c, 500)
            return
        }
        c.Redirect(301, "/")
        return
    case confirmtype.ForgetPassword:
        err = confirm.PushBack(token, confirmdata)
        if err != nil {
            errutil.AbortAndError(c, err.(*errutil.Err))
            return
        }
        session := sessions.Default(c)
        session.Set("token", token)
        session.Save()
        c.Redirect(301, "/Passwd")
    default:
        errutil.AbortAndStatus(c, 404)
        return
    }
}
