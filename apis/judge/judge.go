package judge

import (
    "fmt"
    "bytes"
    "encoding/json"
    "io/ioutil"
    "net/url"
    "net/http"
    "net/http/httputil"
    "github.com/gin-gonic/gin"

    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab/content"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/score"

    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
)

func proxy(path string, rewrite func(*httputil.ProxyRequest)) (proxydata *httputil.ReverseProxy) {
    proxydata = &httputil.ReverseProxy{}
    proxydata.Rewrite = func(req *httputil.ProxyRequest) {
        req.Out.Header.Del("X-Real-Ip")
        req.Out.Host = req.In.Host
        req.Out.URL.Scheme = config.JudgeScheme
        req.Out.URL.Host = fmt.Sprintf("%s:%s", config.JudgeHost, config.JudgePort)
        req.Out.URL.Path = path
        if rewrite != nil {
            rewrite(req)
        }
    }
    proxydata.ModifyResponse = func(resp *http.Response) error {
        return nil
    }
    return
}

func DownloadLabFile(c *gin.Context, labId, filename string) {
    proxy(fmt.Sprintf("/labs/%s/file/%s", labId, filename), nil).ServeHTTP(c.Writer, c.Request)
}

func Pubkey(c *gin.Context) {
    proxy("/pubkey", nil).ServeHTTP(c.Writer, c.Request)
}

func CanJudge(c *gin.Context, userdata user.User) {
    postdata, _ := json.Marshal(struct {
        Username string `json:"username"`
    } {
        Username: userdata.Username,
    })
    proxy("/score/canjudge", func(req *httputil.ProxyRequest) {
        req.Out.Method = http.MethodPost
        req.Out.Body = ioutil.NopCloser(bytes.NewReader(postdata))
        req.Out.ContentLength = int64(len(postdata))
        req.Out.Header.Set("Content-Type", "application/json")
    }).ServeHTTP(c.Writer, c.Request)
}

func CheckAlive() bool {
    nowurl, err := url.JoinPath(fmt.Sprintf("%s://%s:%s", config.JudgeScheme, config.JudgeHost, config.JudgePort), "/status/alive")
    if err != nil {
        return false
    }
    res, err := http.Get(nowurl)
    if err != nil {
        return false
    }
    result, err := ioutil.ReadAll(res.Body)
    if err != nil {
        return false
    }
    var resultbool bool
    err = json.Unmarshal(result, &resultbool)
    if err != nil {
        return false
    }
    return resultbool
}

func Judge(labdata lab.Lab, userdata user.User, contents content.Contents) (score.Score, error) {
    if !CheckAlive() {
        return score.Score{}, fmt.Errorf("judge api dead")
    }
    nowurl, err := url.JoinPath(fmt.Sprintf("%s://%s:%s", config.JudgeScheme, config.JudgeHost, config.JudgePort), "/score/judge")
    if err != nil {
        return score.Score{}, err
    }
    postdata, _ := json.Marshal(struct {
        LabId string `json:"labId"`
        Username string `json:"username"`
        Contents content.Contents `json:"contents"`
    } {
        LabId: labdata.LabId,
        Username: userdata.Username,
        Contents: contents,
    })
    res, err := http.Post(nowurl, "application/json", bytes.NewReader(postdata))
    if err != nil {
        return score.Score{}, err
    }
    result, err := ioutil.ReadAll(res.Body)
    if err != nil {
        return score.Score{}, err
    }
    var scoreid uint
    err = json.Unmarshal(result, &scoreid)
    if err != nil {
        return score.Score{}, err
    }
    nowscore, err := score.GetScore(scoreid, true)
    if err != nil {
        return score.Score{}, err
    }
    return nowscore, err
}
