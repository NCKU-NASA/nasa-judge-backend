package confirm

import (
    "fmt"
    "time"
    "bytes"
    "encoding/json"
    "github.com/google/uuid"
    
    confirmtype "github.com/NCKU-NASA/nasa-judge-lib/enum/confirm_type"

    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/errutil"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/redis"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/smtp"
)

const (
    tablename = "confirm"
)

type confirm struct {
    Type confirmtype.ConfirmType
    Data json.RawMessage
}

func genrediskey(ctype confirmtype.ConfirmType, email, token string) string {
    ctypestr := "*"
    if ctype != confirmtype.Unknown {
        ctypestr = ctype.String()
    }
    return fmt.Sprintf("%s:%s:%s:%s", tablename, ctypestr, email, token)
}

func Push(ctype confirmtype.ConfirmType, email string, data any) error {
    keys, _ := redis.Scan(genrediskey(ctype, email, "*"))
    if len(keys) > 0 {
        err := &errutil.Err{
            Code: 429,
            Msg: "Confirm exist. Please wait 5 min.",
        }
        return err
    }
    token := uuid.New().String()
    for keys, _ = redis.Scan(genrediskey(confirmtype.Unknown, "*", token)); len(keys) > 0; keys, _ = redis.Scan(genrediskey(confirmtype.Unknown, "*", token)) {
        token = uuid.New().String()
    }
    datajson, err := json.Marshal(data)
    if err != nil {
        err = &errutil.Err{
            Code: 500,
            Msg: "Push confirm error !",
        }
        return err
    }
    ele := confirm{
        Type: ctype,
        Data: json.RawMessage(datajson),
    }
    err = redis.Set(genrediskey(ctype, email, token), ele, time.Minute * 5)
    if err != nil {
        err = &errutil.Err{
            Code: 500,
            Msg: "Push confirm error !",
        }
        return err
    }
    var buf bytes.Buffer
    if err = ctype.GetTemplate().Execute(&buf, struct {
        URL string
        Token string
        Data any
    }{
        URL: config.URL,
        Token: token,
        Data: data,
    }); err != nil {
        err = &errutil.Err{
            Code: 500,
            Msg: "Push confirm error !",
        }
        return err
    }
    if err = smtp.SendMail([]string{email}, ctype.GetSubject(), buf.String()); err != nil {
        return &errutil.Err{
            Code: 500,
            Msg: err.Error(),
        }
    }
    return nil
}

func PushBack(token string, data confirm) error {
    err := redis.Set(genrediskey(data.Type, ".", token), data, time.Minute * 5)
    if err != nil {
        err = &errutil.Err{
            Code: 500,
            Msg: "Push confirm error !",
        }
        return err
    }
    return nil
}

func Pop(token string) (data confirm, err error) {
    err = redis.Get(genrediskey(confirmtype.Unknown, "*", token), &data)
    if err != nil {
        err = &errutil.Err{
            Code: 404,
            Msg: "Token not found !",
        }
        return
    }
    redis.Del(genrediskey(confirmtype.Unknown, "*", token))
    return
}


