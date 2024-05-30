package score
import (
    "strconv"
    "encoding/json"

    "github.com/gin-gonic/gin"
    
    "github.com/NCKU-NASA/nasa-judge-lib/schema/lab"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/score"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"

    "github.com/NCKU-NASA/nasa-judge-backend/middlewares/auth"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
)

var router *gin.RouterGroup

func Init(r *gin.RouterGroup) {
    router = r
    router.GET("/", auth.CheckIsAdmin, getscores)
    router.GET("/:labId", auth.CheckSignIn, getlabscore)
}

func getscores(c *gin.Context) {
    filter := score.ScoreFilter{
        User: user.User{
            Username: c.Query("username"),
            StudentId: c.Query("studentId"),
            Email: c.Query("email"),
        },
        LabId: c.Query("labId"),
        KeyField: c.Query("keyfield"),
    }
    if c.Query("score") != "" {
        tmpfloat, err := strconv.ParseFloat(c.Query("score"), 32)
        if err != nil {
            errutil.AbortAndStatus(c, 400)
            return
        }
        filter.Score = new(float32)
        *(filter.Score) = float32(tmpfloat)
    }
    if c.Query("showfields") != "" {
        err := json.Unmarshal([]byte(c.Query("showfields")), &filter.ShowFields)
        if err != nil {
            errutil.AbortAndStatus(c, 400)
            return
        }
    }
    if c.Query("groups") != "" {
        err := json.Unmarshal([]byte(c.Query("groups")), &filter.Groups)
        if err != nil {
            errutil.AbortAndStatus(c, 400)
            return
        }
    }
    if c.Query("max") != "" {
        var err error
        filter.Max, err = strconv.ParseBool(c.Query("max"))
        if err != nil {
            errutil.AbortAndStatus(c, 400)
            return
        }
    }
    scores, err := filter.GetScores(score.Scores{})
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    c.JSON(200, scores)
}

func getlabscore(c *gin.Context) {
    userdata, _ := c.Get("user")
    labId := c.Param("labId")
    if labId == "" {
        errutil.AbortAndStatus(c, 404)
        return
    }
    labdata, err := lab.GetLab(labId)
    if err != nil {
        errutil.AbortAndStatus(c, 404)
        return
    }
    var basescore float32
    for _, allcheckpoint := range labdata.CheckPoints {
        for _, checkpoint := range allcheckpoint {
            basescore += checkpoint.Weight
        }
    }
    filter := score.ScoreFilter{
        LabId: labId,
    }
    scores, err := filter.GetScores(score.Scores{})
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    filter = score.ScoreFilter{
        Max: true,
    }
    maxscores, err := filter.GetScores(scores)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    filter = score.ScoreFilter{
        Score: &basescore,
    }
    fullscores, err := filter.GetScores(maxscores)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    filter = score.ScoreFilter{
        User: userdata.(user.User),
        UseDeadline: true,
        Max: true,
    }
    userscores, err := filter.GetScores(scores)
    if err != nil {
        errutil.AbortAndStatus(c, 500)
        return
    }
    var userscore float32
    if len(userscores.Scores) > 0 {
        userscore = userscores.Scores[0].Score
    } else {
        userscore = 0
    }
    
    c.JSON(200, struct {
        Score float32 `json:"score"`
        DoCount int `json:"docount"`
        PassCount int `json:"passcount"`
    } {
        Score: userscore,
        DoCount: len(maxscores.Scores),
        PassCount: len(fullscores.Scores),
    })
}
