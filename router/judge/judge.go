package judge
import (
    "io/ioutil"
    "encoding/base64"

    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab/content"
    contenttype "github.com/NCKU-NASA/nasa-judge-lib/enum/content_type"

    "github.com/NCKU-NASA/nasa-judge-backend/apis/judge"
    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.POST("/", auth.CheckSignIn, onjudge)
    router.GET("/canjudge", auth.CheckSignIn, canjudge)
}

func canjudge(c *gin.Context) {
    userdata, _ := c.Get("user")
    judge.CanJudge(c, userdata.(user.User))
}

func onjudge(c *gin.Context) {
    form, _ := c.MultipartForm()
    userdata, _ := c.Get("user")
    labId := c.PostForm("id")
    labdata, err := lab.GetLab(labId)
    if err != nil {
        errutil.AbortAndStatus(c, 400)
        return
    }
    var contents content.Contents
    for key, value := range c.Request.PostForm {
        if key == "id" {
            continue
        }
        contents = append(contents, content.Content{
            Type: contenttype.Input,
            Name: key,
            Data: value[0],
        })
    }
    for key, value := range form.File {
        f, err := value[0].Open()
        if err != nil {
            errutil.AbortAndStatus(c, 500)
            return
        }
        result, err := ioutil.ReadAll(f)
        if err != nil {
            errutil.AbortAndStatus(c, 500)
            return
        }
        contents = append(contents, content.Content{
            Type: contenttype.Upload,
            Name: key,
            Data: base64.StdEncoding.EncodeToString(result),
        })
    }
    nowscore, err := judge.Judge(labdata, userdata.(user.User), contents)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    nowscore.User = nil
    nowscore.Lab = nil
    nowscore.Data = nil
    c.JSON(200, nowscore)
}
