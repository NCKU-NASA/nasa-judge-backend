package module

import (
    "bytes"
    "io/ioutil"
    "net/http"
    "net/url"
    "encoding/json"
    "github.com/NCKU-NASA/nasa-judge-lib/schema/user"
)

type ModuleAPI string

func (c ModuleAPI) Update(userdata user.User) error {
    postdata, _ := json.Marshal(struct {
        Username string `json:"username"`
    } {
        Username: userdata.Username,
    })
    nowurl, err := url.JoinPath(string(c), "update")
    if err != nil {
        return err
    }
    _, err = http.Post(nowurl, "application/json", bytes.NewReader(postdata))
    return err
}

func (c ModuleAPI) Get(userdata user.User) (map[string]string, error) {
    client := &http.Client{}
    nowurl, err := url.JoinPath(string(c), "get")
    if err != nil {
        return nil, err
    }
    req, err := http.NewRequest("GET", nowurl, nil)
    if err != nil {
        return nil, err
    }
    q := req.URL.Query()
    q.Add("username", userdata.Username)
    req.URL.RawQuery = q.Encode()
    res, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer res.Body.Close()
    resultbyte, err := ioutil.ReadAll(res.Body)
    if err != nil {
        return nil, err
    }
    var nowresult map[string]string
    err = json.Unmarshal(resultbyte, &nowresult)
    return nowresult, err
}

