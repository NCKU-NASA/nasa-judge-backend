package labs
import (
    "fmt"
    "sort"
    "strconv"
    "bytes"

    "github.com/gin-gonic/gin"
    "github.com/go-echarts/go-echarts/v2/charts"
    "github.com/go-echarts/go-echarts/v2/opts"
    //"github.com/vincent-petithory/dataurl"
    
    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/score"

    "github.com/NCKU-NASA/nasa-judge-backend/apis/judge"
    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckSignIn, getlabs)
    router.GET("/:labId/download/:filename", download)
    router.GET("/:labId/chart", getchart)
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
    judge.DownloadLabFile(c, labId, filename)
}

func getchart(c *gin.Context) {
    labId := c.Param("labId")
    if labId == "" {
        errutil.AbortAndStatus(c, 404)
        return
    }
    filter := score.ScoreFilter{
        LabId: labId,
        Max: true,
    }
    allscores, err := filter.GetScores(score.Scores{})
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    count := make(map[float32]int)
    for _, nowscore := range allscores.Scores {
        if _, exist := count[nowscore.Score]; !exist {
            count[nowscore.Score] = 0
        }
        count[nowscore.Score]++
    }
    var countslice []struct{
        Label float32
        Value int
    }
    for key, val := range count {
        countslice = append(countslice, struct{
            Label float32
            Value int
        }{Label: key, Value: val})
    }
    sort.Slice(countslice, func(i, j int) bool { return countslice[i].Label < countslice[j].Label })
    bar := charts.NewBar()
    var labels []string
    var bardata []opts.BarData
    for _, val := range countslice {
        labels = append(labels, strconv.FormatFloat(float64(val.Label), 'f', -1, 32))
        bardata = append(bardata, opts.BarData{Value: val.Value})
    }
    bar.SetXAxis(labels).AddSeries("users", bardata)
    var buf bytes.Buffer
    bar.Render(&buf)
    c.Data(200, "text/html", buf.Bytes())
}
