package labs
import (
    "fmt"
    "net/http/httputil"
    "net/http"

    "github.com/gin-gonic/gin"
    
    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckSignIn, getlabs)
    router.GET("/:labId/download/:filename", download)
    router.GET("/:labId/chart", chart)
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
    labs, err := lab.GetLabs()
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }

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

func download(c *gin.Context) {
    labId := c.Param("labId")
    filename := c.Param("filename")
    userdata := user.User{
        Username: c.Query("username"),
    }
    token := c.Query("token")
    userdata.Fix()
    if userdata.Username == "" {
        errutil.AbortAndStatus(c, 404)
        return
    }
    userdata, err := user.GetUser(userdata)
    if err != nil {
        errutil.AbortAndStatus(c, 404)
        return
    }
    if !userdata.VerifyToken(token, fmt.Sprintf("%s/%s", labId, filename)) {
        errutil.AbortAndStatus(c, 404)
        return
    }
    proxy := &httputil.ReverseProxy{}
    proxy.Rewrite = func(req *httputil.ProxyRequest) {
        req.Out.Header.Del("X-Real-Ip")
        req.Out.Host = req.In.Host
        req.Out.URL.Scheme = config.JudgeScheme
        req.Out.URL.Host = fmt.Sprintf("%s:%s", config.JudgeHost, config.JudgePort)
        req.Out.URL.Path = fmt.Sprintf("/labs/%s/file/%s", labId, filename)
    }
    proxy.ModifyResponse = func(resp *http.Response) error {
        return nil
    }
    proxy.ServeHTTP(c.Writer, c.Request)
}

func chart(c *gin.Context) {
    //labId := c.Param("labId")
    c.String(200, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShIVSSZgYy3jiOc1pSWE-yCZXAnyngahH9K-f901Z1UQ&s")
}
