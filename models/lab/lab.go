package lab

import (
    "golang.org/x/exp/slices"

    "github.com/NCKU-NASA/nasa-judge-backend/models/user"
)

type Lab struct {
    LabId string `json:"labId"`
    Promissions []user.Group `json:"promissions"`
}

func GetLabs() ([]Lab) {
    return []Lab{}
}

func (lab Lab) ContainPromission(group string) bool {
    return slices.ContainsFunc(lab.Promissions, func(g user.Group) bool {
        return g.Groupname == group
    })    
}
