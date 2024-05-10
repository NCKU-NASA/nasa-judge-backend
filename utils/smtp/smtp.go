package smtp

import (
    "fmt"
    "net/smtp"

    "github.com/jordan-wright/email"
    "github.com/NCKU-NASA/nasa-judge-backend/utils/config"
)

func SendMail(to []string, subject string, html string) error {
    e := &email.Email {
        From: fmt.Sprintf("%s <%s>", config.SMTPusername, config.SMTPuser),
        To: to,
        Subject: subject,
        HTML: []byte(html),
    }
    return e.Send(fmt.Sprintf("%s:%s", config.SMTPhost, config.SMTPport), smtp.PlainAuth("", config.SMTPuser, config.SMTPpasswd, config.SMTPhost))
}

