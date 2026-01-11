package models

import (
	"emoons-web/db"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int64  `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"`
	Fullname     string `json:"fullname"`
}

func GetUserByUsername(username string) (*User, error) {
	var user User
	err := db.DB.QueryRow(
		"SELECT id, username, password_hash, fullname FROM Usuarios WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Fullname)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByID(id int64) (*User, error) {
	var user User
	err := db.DB.QueryRow(
		"SELECT id, username, password_hash, fullname FROM Usuarios WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Fullname)

	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
