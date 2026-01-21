package models

import (
	"database/sql"
	"emoons-web/db"
	"log"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int64  `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"`
	Fullname     string `json:"fullname"`
	IsAdmin      bool   `json:"is_admin"`
}

type UserWithStats struct {
	User
	ClassifiedTransits int    `json:"classified_transits"`
	TotalTransits      int    `json:"total_transits"`
	LastActivity       string `json:"last_activity,omitempty"`
}

func GetUserByUsername(username string) (*User, error) {
	var user User
	var isAdmin int
	err := db.DB.QueryRow(
		"SELECT id, username, password_hash, fullname, is_admin FROM Users WHERE username = ?",
		username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Fullname, &isAdmin)

	if err != nil {
		return nil, err
	}
	user.IsAdmin = isAdmin == 1
	return &user, nil
}

func GetUserByID(id int64) (*User, error) {
	var user User
	var isAdmin int
	err := db.DB.QueryRow(
		"SELECT id, username, password_hash, fullname, is_admin FROM Users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Fullname, &isAdmin)

	if err != nil {
		return nil, err
	}
	user.IsAdmin = isAdmin == 1
	return &user, nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func ListUsers() ([]UserWithStats, error) {
	rows, err := db.DB.Query(`
		SELECT
			u.id, u.username, u.fullname, u.is_admin,
			COUNT(c.id) as classified_transits,
			MAX(c.timestamp) as last_activity
		FROM Users u
		LEFT JOIN Classifications c ON u.id = c.user_id
		GROUP BY u.id
		ORDER BY u.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	totalTransits := GetTotalTransitCount()

	var users []UserWithStats
	for rows.Next() {
		var u UserWithStats
		var isAdmin int
		var lastActivity sql.NullString
		if err := rows.Scan(&u.ID, &u.Username, &u.Fullname, &isAdmin, &u.ClassifiedTransits, &lastActivity); err != nil {
			return nil, err
		}
		u.IsAdmin = isAdmin == 1
		u.TotalTransits = totalTransits
		if lastActivity.Valid {
			u.LastActivity = lastActivity.String
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func CreateUser(username, password, fullname string, isAdmin bool) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	isAdminInt := 0
	if isAdmin {
		isAdminInt = 1
	}

	result, err := db.DB.Exec(
		"INSERT INTO Users (username, password_hash, fullname, is_admin) VALUES (?, ?, ?, ?)",
		username, string(hash), fullname, isAdminInt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &User{
		ID:       id,
		Username: username,
		Fullname: fullname,
		IsAdmin:  isAdmin,
	}, nil
}

func UpdateUser(id int64, fullname string, isAdmin bool) error {
	isAdminInt := 0
	if isAdmin {
		isAdminInt = 1
	}

	_, err := db.DB.Exec(
		"UPDATE Users SET fullname = ?, is_admin = ? WHERE id = ?",
		fullname, isAdminInt, id,
	)
	return err
}

func DeleteUser(id int64) error {
	// Delete user's classifications first
	_, err := db.DB.Exec("DELETE FROM Classifications WHERE user_id = ?", id)
	if err != nil {
		return err
	}

	// Delete the user
	_, err = db.DB.Exec("DELETE FROM Users WHERE id = ?", id)
	return err
}

func EnsureAdminUser(username, password string) error {
	// Check if admin user exists
	user, err := GetUserByUsername(username)
	if err == sql.ErrNoRows {
		// Create admin user
		_, err = CreateUser(username, password, "Administrator", true)
		if err != nil {
			return err
		}
		log.Printf("Created admin user: %s", username)
		return nil
	}
	if err != nil {
		return err
	}

	// Ensure user is admin
	if !user.IsAdmin {
		err = UpdateUser(user.ID, user.Fullname, true)
		if err != nil {
			return err
		}
		log.Printf("Promoted user to admin: %s", username)
	}

	return nil
}
