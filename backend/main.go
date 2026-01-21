package main

import (
	"emoons-web/db"
	"emoons-web/handlers"
	"emoons-web/middleware"
	"emoons-web/models"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Configuration
	dbPath := getEnv("DATABASE_PATH", "../db/transit_analysis.db")
	csvPath := getEnv("CSV_PATH", "../plots/transits.csv")
	plotsDir := getEnv("PLOTS_DIR", "../plots")
	frontendDir := getEnv("FRONTEND_DIR", "")
	port := getEnv("PORT", "8080")
	adminUsername := getEnv("ADMIN_USERNAME", "admin")
	adminPassword := getEnv("ADMIN_PASSWORD", "admin")

	// Connect to database
	if err := db.Connect(dbPath); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := db.RunMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Ensure admin user exists
	if err := models.EnsureAdminUser(adminUsername, adminPassword); err != nil {
		log.Fatalf("Failed to ensure admin user: %v", err)
	}

	// Load transit data from CSV
	if err := models.LoadTransitsFromCSV(csvPath); err != nil {
		log.Printf("Warning: Failed to load transits CSV: %v", err)
	} else {
		log.Printf("Loaded transits for %d files", len(models.GetAllFiles()))
	}

	// Setup Gin router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Serve static plot images
	r.Static("/plots", plotsDir)

	// Public routes
	r.POST("/api/auth/login", handlers.Login)

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.AuthRequired())
	{
		// Auth
		api.GET("/auth/me", handlers.GetMe)
		api.POST("/auth/logout", handlers.Logout)

		// Curves
		api.GET("/curves", handlers.GetCurves)
		api.GET("/curves/:id", handlers.GetCurve)
		api.GET("/curves/:id/transits", handlers.GetCurveTransits)

		// Transits
		api.GET("/transits/:file", handlers.GetTransitsByFile)
		api.GET("/transits/:file/:index", handlers.GetTransit)

		// Classifications
		api.GET("/transits/:file/:index/classify", handlers.GetClassification)
		api.POST("/transits/:file/:index/classify", handlers.SaveClassification)
		api.DELETE("/curves/:id/classifications", handlers.DeleteCurveClassifications)

		// Stats
		api.GET("/stats", handlers.GetStats)

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AdminRequired())
		{
			admin.GET("/users", handlers.ListUsers)
			admin.POST("/users", handlers.CreateUser)
			admin.PUT("/users/:id", handlers.UpdateUser)
			admin.DELETE("/users/:id", handlers.DeleteUser)
			admin.GET("/users/:id/stats", handlers.GetUserStats)
			admin.GET("/users/:id/export", handlers.ExportUserClassifications)
		}
	}

	// Serve frontend static files (for production)
	if frontendDir != "" {
		r.Static("/assets", frontendDir+"/assets")
		r.StaticFile("/favicon.ico", frontendDir+"/favicon.ico")
		r.StaticFile("/logo.jpg", frontendDir+"/logo.jpg")
		r.StaticFile("/login-bg.png", frontendDir+"/login-bg.png")

		// SPA fallback: serve index.html for non-API, non-static routes
		r.NoRoute(func(c *gin.Context) {
			path := c.Request.URL.Path
			if !strings.HasPrefix(path, "/api/") && !strings.HasPrefix(path, "/plots/") {
				c.File(frontendDir + "/index.html")
				return
			}
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		})
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
