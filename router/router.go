package router
import (
    "fmt"
    "net/http/httputil"
    "net/http"

    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
    "github.com/NCKU-NASA/nasa-judge-backend/router/user"
    "github.com/NCKU-NASA/nasa-judge-backend/router/labs"
    "github.com/NCKU-NASA/nasa-judge-backend/router/score"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r

    router.GET("/pubkey", pubkey)

    user.Init(router.Group("/user"))
    labs.Init(router.Group("/labs"))
    score.Init(router.Group("/score"))
}

func pubkey(c *gin.Context) {
    proxy := &httputil.ReverseProxy{}
    proxy.Rewrite = func(req *httputil.ProxyRequest) {
        req.Out.Header.Del("X-Real-Ip")
        req.Out.Host = req.In.Host
        req.Out.URL.Scheme = config.JudgeScheme
        req.Out.URL.Host = fmt.Sprintf("%s:%s", config.JudgeHost, config.JudgePort)
        req.Out.URL.Path = req.In.URL.Path
    }
    proxy.ModifyResponse = func(resp *http.Response) error {
        return nil
    }
    proxy.ServeHTTP(c.Writer, c.Request)
}
