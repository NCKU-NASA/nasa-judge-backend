package config

import (
    "os"
    "strconv"
)

var Debug bool
var URL string
var Port string
var Secret string
var Sessionname string
var AdminUser string
var AdminPasswd string
var DBservice string
var DBuser string
var DBpasswd string
var DBhost string
var DBport string
var DBname string
var DBdebug bool
var RedisURL string
var RedisPasswd string
var SMTPhost string
var SMTPport string
var SMTPuser string
var SMTPusername string
var SMTPpasswd string
var StudentEmailDomain string

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
    dbdebugstr, exists := os.LookupEnv("DBDEBUG")
    if !exists {
        DBdebug = true
    } else {
        DBdebug, err = strconv.ParseBool(dbdebugstr)
        if err != nil {
            DBdebug = false
        }
    }
    URL = os.Getenv("URL")
    Port = os.Getenv("PORT")
    Secret = os.Getenv("SECRET")
    Sessionname = os.Getenv("SESSIONNAME")
    AdminUser = os.Getenv("ADMINUSER")
    AdminPasswd = os.Getenv("ADMINPASSWD")
    DBservice = os.Getenv("DBSERVICE")
    DBuser = os.Getenv("DBUSER")
    DBpasswd = os.Getenv("DBPASSWD")
    DBhost = os.Getenv("DBHOST")
    DBport = os.Getenv("DBPORT")
    DBname = os.Getenv("DBNAME")
    RedisURL = os.Getenv("REDISURL")
    RedisPasswd = os.Getenv("REDISPASSWD")
    SMTPhost = os.Getenv("SMTP_HOST")
    SMTPport = os.Getenv("SMTP_PORT")
    SMTPuser = os.Getenv("SMTP_USER")
    SMTPusername = os.Getenv("SMTP_USERNAME")
    SMTPpasswd = os.Getenv("SMTP_PASSWD")
    StudentEmailDomain = os.Getenv("STUDENT_EMAIL_DOMAIN")
}
