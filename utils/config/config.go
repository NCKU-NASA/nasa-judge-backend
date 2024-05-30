package config

import (
    "os"
    "strconv"
    "strings"

    "github.com/NCKU-NASA/nasa-judge-backend/apis/module"
)

var Debug bool
var URL string
var Port string
var Secret string
var Sessionname string
var AdminUser string
var AdminPasswd string
var RedisURL string
var RedisPasswd string
var SMTPhost string
var SMTPport string
var SMTPuser string
var SMTPusername string
var SMTPpasswd string
var StudentEmailDomain string
var JudgeScheme string
var JudgeHost string
var JudgePort string
var UserModuleAPIs []module.ModuleAPI

func init() {
    loadenv()
    var err error
    debugstr, exists := os.LookupEnv("DEBUG")
    if !exists {
        Debug = false
    } else {
        Debug, err = strconv.ParseBool(debugstr)
        if err != nil {
            Debug = false
        }
    }
    URL = os.Getenv("URL")
    Port = os.Getenv("PORT")
    Secret = os.Getenv("SECRET")
    Sessionname = os.Getenv("SESSIONNAME")
    AdminUser = os.Getenv("ADMINUSER")
    AdminPasswd = os.Getenv("ADMINPASSWD")
    RedisURL = os.Getenv("REDISURL")
    RedisPasswd = os.Getenv("REDISPASSWD")
    SMTPhost = os.Getenv("SMTP_HOST")
    SMTPport = os.Getenv("SMTP_PORT")
    SMTPuser = os.Getenv("SMTP_USER")
    SMTPusername = os.Getenv("SMTP_USERNAME")
    SMTPpasswd = os.Getenv("SMTP_PASSWD")
    StudentEmailDomain = os.Getenv("STUDENT_EMAIL_DOMAIN")
    JudgeScheme = os.Getenv("JUDGE_SCHEME")
    JudgeHost = os.Getenv("JUDGE_HOST")
    JudgePort = os.Getenv("JUDGE_PORT")
    userapitmp := strings.Split(os.Getenv("USERMODULEAPIS"), "\n")
    UserModuleAPIs = make([]module.ModuleAPI, len(userapitmp))
    for idx, api := range userapitmp {
        UserModuleAPIs[idx] = module.ModuleAPI(strings.Trim(api, " \t\n"))
    }
}
