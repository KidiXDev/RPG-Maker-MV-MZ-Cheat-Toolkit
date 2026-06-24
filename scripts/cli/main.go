package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const MarkerStart = "/* === RMC-CHEAT-TOOLKIT:START (do not edit) === */"
const MarkerEnd = "/* === RMC-CHEAT-TOOLKIT:END === */"

type GameConfig struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	Engine      string    `json:"engine"`
	InstalledAt time.Time `json:"installed_at"`
	Diagnostic  bool      `json:"diagnostic"`
}

type Registry struct {
	InstalledGames []GameConfig `json:"installed_games"`
}

type GameInfo struct {
	Engine      string
	MainJSPath  string
	CheatDir    string
	SettingsDir string
}

func main() {
	isInteractive := len(os.Args) == 1
	if isInteractive {
		defer pause()
	}

	runInteractive()
}

func pause() {
	fmt.Println("\nPress Enter to exit...")
	_, _ = bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func clearScreen() {
	fmt.Print("\033[H\033[2J")
}

func runInteractive() {
	reader := bufio.NewReader(os.Stdin)
	for {
		clearScreen()
		fmt.Println("==================================================")
		fmt.Println("          RPG MAKER MV/MZ CHEAT TOOLKIT           ")
		fmt.Println("==================================================")
		fmt.Println()

		reg, err := loadRegistry()
		if err == nil && len(reg.InstalledGames) > 0 {
			fmt.Println("Tracked Installations:")
			for i, game := range reg.InstalledGames {
				diagStr := ""
				if game.Diagnostic {
					diagStr = " (Diagnostic)"
				}
				fmt.Printf("  %d. [%s] %s%s\n", i+1, game.Engine, game.Name, diagStr)
				fmt.Printf("     Path: %s\n", game.Path)
			}
			fmt.Println()
		}

		fmt.Println("Select an option:")
		fmt.Println("[1] Install Cheat Toolkit")
		fmt.Println("[2] Uninstall / Restore Game")
		if err == nil && len(reg.InstalledGames) > 0 {
			fmt.Println("[3] Update All Installed Games")
			fmt.Println("[4] Exit")
		} else {
			fmt.Println("[3] Exit")
		}
		fmt.Println()
		fmt.Print("Choice: ")

		choice, _ := reader.ReadString('\n')
		choice = strings.TrimSpace(choice)

		switch choice {
		case "1":
			installWizard(reader)
		case "2":
			uninstallWizard(reader)
		case "3":
			if err == nil && len(reg.InstalledGames) > 0 {
				updateAllWizard(reader)
			} else {
				return
			}
		case "4":
			if err == nil && len(reg.InstalledGames) > 0 {
				return
			}
		}

		fmt.Println("\nPress Enter to return to menu...")
		_, _ = reader.ReadString('\n')
	}
}

func installWizard(reader *bufio.Reader) {
	fmt.Println("\n--- Install Cheat Toolkit ---")
	fmt.Print("Enter game folder path (drag & drop here): ")
	gamePathInput, _ := reader.ReadString('\n')
	gamePath := cleanPath(gamePathInput)
	if gamePath == "" {
		fmt.Println("[ERROR] Path cannot be empty.")
		return
	}

	game, err := detectGame(gamePath)
	if err != nil {
		fmt.Printf("[ERROR] %v\n", err)
		return
	}

	fmt.Printf("[INFO] Detected RPG Maker %s game.\n", game.Engine)
	fmt.Printf("[INFO] Main script file: %s\n", game.MainJSPath)

	fmt.Print("Enable diagnostic logging? (y/n) [default: n]: ")
	diagInput, _ := reader.ReadString('\n')
	diagInput = strings.ToLower(strings.TrimSpace(diagInput))
	diagnostic := diagInput == "y" || diagInput == "yes"

	// 1. Create Backup
	backupPath := game.MainJSPath + ".rmc-backup"
	if !fileExists(backupPath) {
		input, err := os.ReadFile(game.MainJSPath)
		if err != nil {
			fmt.Printf("[ERROR] Failed to read main.js: %v\n", err)
			return
		}
		if err := os.WriteFile(backupPath, input, 0644); err != nil {
			fmt.Printf("[ERROR] Failed to create backup: %v\n", err)
			return
		}
		fmt.Printf("[OK] Created entry backup: %s\n", backupPath)
	} else {
		fmt.Println("[OK] Found existing entry backup.")
	}

	// 2. Inject Loader
	currentBytes, err := os.ReadFile(game.MainJSPath)
	if err != nil {
		fmt.Printf("[ERROR] Failed to read main.js: %v\n", err)
		return
	}
	currentContent := string(currentBytes)
	injectedContent := injectLoader(currentContent, diagnostic)

	if injectedContent != currentContent {
		if err := os.WriteFile(game.MainJSPath, []byte(injectedContent), 0644); err != nil {
			fmt.Printf("[ERROR] Failed to write injected loader: %v\n", err)
			return
		}
		fmt.Println("[OK] Injected loader code successfully.")
	} else {
		fmt.Println("[INFO] Loader is already up to date.")
	}

	// Double check injected file
	backupBytes, err := os.ReadFile(backupPath)
	if err != nil {
		fmt.Printf("[ERROR] Failed to read backup: %v\n", err)
		return
	}
	if string(injectedContent) != injectLoader(string(backupBytes), diagnostic) {
		// restore backup
		_ = os.WriteFile(game.MainJSPath, backupBytes, 0644)
		fmt.Println("[ERROR] Verification failed. main.js was modified externally. Backup restored.")
		return
	}

	// 3. Copy cheat bundle files
	if err := copyBundle(game.CheatDir, diagnostic); err != nil {
		fmt.Printf("[ERROR] Failed to copy bundle: %v\n", err)
		return
	}
	fmt.Printf("[OK] Copied cheat bundle files to: %s\n", game.CheatDir)

	// 4. Update Registry
	gameName := getGameName(gamePath)
	err = registerGame(GameConfig{
		ID:          generateID(),
		Name:        gameName,
		Path:        gamePath,
		Engine:      game.Engine,
		InstalledAt: time.Now(),
		Diagnostic:  diagnostic,
	})
	if err != nil {
		fmt.Printf("[WARNING] Failed to update registry database: %v\n", err)
	}

	fmt.Println("\n[SUCCESS] Cheat Toolkit installed successfully!")
	fmt.Println("Press Ctrl+C (or click the floating RMC badge) in the game to open the overlay.")
}

func uninstallWizard(reader *bufio.Reader) {
	fmt.Println("\n--- Uninstall / Restore Game ---")
	reg, err := loadRegistry()
	if err != nil {
		fmt.Printf("[ERROR] Failed to load registry: %v\n", err)
		return
	}

	var targetPath string
	var gameConfig *GameConfig

	if len(reg.InstalledGames) > 0 {
		fmt.Println("Select a game to uninstall:")
		for i, g := range reg.InstalledGames {
			fmt.Printf("  %d. %s (%s)\n", i+1, g.Name, g.Path)
		}
		fmt.Printf("  %d. Uninstall a game at a manual path...\n", len(reg.InstalledGames)+1)
		fmt.Println()
		fmt.Print("Choice: ")

		choiceInput, _ := reader.ReadString('\n')
		choiceInput = strings.TrimSpace(choiceInput)

		var choiceIdx int
		fmt.Sscanf(choiceInput, "%d", &choiceIdx)

		if choiceIdx > 0 && choiceIdx <= len(reg.InstalledGames) {
			gameConfig = &reg.InstalledGames[choiceIdx-1]
			targetPath = gameConfig.Path
		} else if choiceIdx == len(reg.InstalledGames)+1 {
			// manual path fallback
		} else {
			fmt.Println("[ERROR] Invalid choice.")
			return
		}
	}

	if targetPath == "" {
		fmt.Print("Enter game folder path (drag & drop here): ")
		gamePathInput, _ := reader.ReadString('\n')
		targetPath = cleanPath(gamePathInput)
		if targetPath == "" {
			fmt.Println("[ERROR] Path cannot be empty.")
			return
		}
	}

	game, err := detectGame(targetPath)
	if err != nil {
		fmt.Printf("[ERROR] %v\n", err)
		return
	}

	fmt.Print("Purge all cheat settings and configuration files? (y/n) [default: n]: ")
	purgeInput, _ := reader.ReadString('\n')
	purgeInput = strings.ToLower(strings.TrimSpace(purgeInput))
	purge := purgeInput == "y" || purgeInput == "yes"

	// 1. Restore backup or strip loader
	backupPath := game.MainJSPath + ".rmc-backup"
	if fileExists(backupPath) {
		backupBytes, err := os.ReadFile(backupPath)
		if err == nil {
			if err := os.WriteFile(game.MainJSPath, backupBytes, 0644); err == nil {
				fmt.Printf("[OK] Restored main.js from backup.\n")
				_ = os.Remove(backupPath)
			} else {
				fmt.Printf("[ERROR] Failed to write restored main.js: %v\n", err)
				return
			}
		} else {
			fmt.Printf("[ERROR] Failed to read backup: %v\n", err)
			return
		}
	} else {
		// Strip loader block from current main.js
		currentBytes, err := os.ReadFile(game.MainJSPath)
		if err != nil {
			fmt.Printf("[ERROR] Failed to read main.js: %v\n", err)
			return
		}
		stripped := stripLoader(string(currentBytes))
		if err := os.WriteFile(game.MainJSPath, []byte(stripped), 0644); err != nil {
			fmt.Printf("[ERROR] Failed to restore main.js: %v\n", err)
			return
		}
		fmt.Println("[OK] Backup missing; stripped loader block from main.js.")
	}

	// 2. Remove cheat folder
	if err := os.RemoveAll(game.CheatDir); err == nil {
		fmt.Printf("[OK] Removed cheat directory: %s\n", game.CheatDir)
	} else {
		fmt.Printf("[WARNING] Failed to remove cheat directory: %v\n", err)
	}

	// 3. Purge settings
	if purge {
		if err := os.RemoveAll(game.SettingsDir); err == nil {
			fmt.Printf("[OK] Purged settings directory: %s\n", game.SettingsDir)
		} else {
			fmt.Printf("[WARNING] Failed to remove settings directory: %v\n", err)
		}
	} else if fileExists(game.SettingsDir) {
		fmt.Println("[INFO] Note: Saved configurations left intact. Run with purge option to remove.")
	}

	// 4. Update Registry
	if gameConfig != nil {
		err = unregisterGame(gameConfig.ID)
	} else {
		err = unregisterGameByPath(targetPath)
	}
	if err != nil {
		fmt.Printf("[WARNING] Failed to update registry database: %v\n", err)
	}

	fmt.Println("\n[SUCCESS] Uninstallation complete!")
}

func updateAllWizard(_ *bufio.Reader) {
	fmt.Println("\n--- Update All Installed Games ---")
	reg, err := loadRegistry()
	if err != nil {
		fmt.Printf("[ERROR] Failed to load registry: %v\n", err)
		return
	}

	if len(reg.InstalledGames) == 0 {
		fmt.Println("[INFO] No games installed to update.")
		return
	}

	fmt.Printf("Updating %d game(s)...\n\n", len(reg.InstalledGames))
	successCount := 0

	for _, g := range reg.InstalledGames {
		fmt.Printf("Updating: %s (%s)...\n", g.Name, g.Path)
		game, err := detectGame(g.Path)
		if err != nil {
			fmt.Printf("  [ERROR] Detection failed: %v\n", err)
			continue
		}

		// Overwrite bundle
		if err := copyBundle(game.CheatDir, g.Diagnostic); err != nil {
			fmt.Printf("  [ERROR] Copy bundle failed: %v\n", err)
			continue
		}

		fmt.Println("  [OK] Cheat files updated successfully.")
		successCount++
	}

	fmt.Printf("\n[SUCCESS] Update process complete. Updated %d/%d games.\n", successCount, len(reg.InstalledGames))
}

func cleanPath(p string) string {
	p = strings.TrimSpace(p)
	p = strings.Trim(p, "\"`'")
	p = filepath.Clean(p)
	return p
}

func detectGame(gameDir string) (*GameInfo, error) {
	mvMain := filepath.Join(gameDir, "www", "js", "main.js")
	mzMain := filepath.Join(gameDir, "js", "main.js")
	mzObjects := filepath.Join(gameDir, "js", "rmmz_objects.js")

	if fileExists(mzObjects) && fileExists(mzMain) {
		return &GameInfo{
			Engine:      "MZ",
			MainJSPath:  mzMain,
			CheatDir:    filepath.Join(gameDir, "cheat"),
			SettingsDir: filepath.Join(gameDir, "cheat-settings"),
		}, nil
	}

	if fileExists(mvMain) {
		return &GameInfo{
			Engine:      "MV",
			MainJSPath:  mvMain,
			CheatDir:    filepath.Join(gameDir, "www", "cheat"),
			SettingsDir: filepath.Join(gameDir, "www", "cheat-settings"),
		}, nil
	}

	return nil, fmt.Errorf("could not detect RPG Maker MV or MZ (expected www/js/main.js or js/rmmz_objects.js)")
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func getGameName(gameDir string) string {
	pkgPath := filepath.Join(gameDir, "package.json")
	if fileExists(pkgPath) {
		data, err := os.ReadFile(pkgPath)
		if err == nil {
			var pkg struct {
				Name        string `json:"name"`
				Description string `json:"description"`
			}
			if err := json.Unmarshal(data, &pkg); err == nil {
				if pkg.Name != "" {
					return pkg.Name
				}
				if pkg.Description != "" {
					return pkg.Description
				}
			}
		}
	}
	return filepath.Base(gameDir)
}

func findSourceFiles() (string, string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", "", fmt.Errorf("failed to get executable path: %w", err)
	}
	execDir := filepath.Dir(execPath)

	// Candidate patterns:
	// 1. Executable in root: dist/cheat.js and scripts/rmc-diagnostic.js
	// 2. Executable in scripts/: ../dist/cheat.js and rmc-diagnostic.js
	// 3. Executable in scripts/cli/: ../../dist/cheat.js and ../rmc-diagnostic.js
	// 4. Flat directory (same folder): cheat.js and rmc-diagnostic.js
	candidates := []struct {
		cheatPath string
		diagPath  string
	}{
		{
			cheatPath: filepath.Join(execDir, "dist", "cheat.js"),
			diagPath:  filepath.Join(execDir, "scripts", "rmc-diagnostic.js"),
		},
		{
			cheatPath: filepath.Join(execDir, "..", "dist", "cheat.js"),
			diagPath:  filepath.Join(execDir, "rmc-diagnostic.js"),
		},
		{
			cheatPath: filepath.Join(execDir, "..", "..", "dist", "cheat.js"),
			diagPath:  filepath.Join(execDir, "..", "rmc-diagnostic.js"),
		},
		{
			cheatPath: filepath.Join(execDir, "cheat.js"),
			diagPath:  filepath.Join(execDir, "rmc-diagnostic.js"),
		},
	}

	for _, c := range candidates {
		if fileExists(c.cheatPath) {
			return c.cheatPath, c.diagPath, nil
		}
	}

	return "", "", fmt.Errorf("could not find source file cheat.js (searched dist/cheat.js, ../dist/cheat.js, cheat.js)")
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	return out.Sync()
}

func copyBundle(cheatDir string, diagnostic bool) error {
	cheatSrc, diagSrc, err := findSourceFiles()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(cheatDir, 0755); err != nil {
		return err
	}

	// Copy cheat.js
	if err := copyFile(cheatSrc, filepath.Join(cheatDir, "cheat.js")); err != nil {
		return fmt.Errorf("failed to copy cheat.js from %s: %w", cheatSrc, err)
	}

	diagPath := filepath.Join(cheatDir, "rmc-diagnostic.js")
	if diagnostic {
		if fileExists(diagSrc) {
			if err := copyFile(diagSrc, diagPath); err != nil {
				return fmt.Errorf("failed to copy rmc-diagnostic.js from %s: %w", diagSrc, err)
			}
		} else {
			return fmt.Errorf("diagnostic mode enabled but source file rmc-diagnostic.js not found at: %s", diagSrc)
		}
	} else {
		_ = os.Remove(diagPath)
	}

	return nil
}

func stripLoader(content string) string {
	startIdx := strings.Index(content, MarkerStart)
	endIdx := strings.Index(content, MarkerEnd)
	if startIdx == -1 || endIdx == -1 {
		return content
	}

	blockEnd := endIdx + len(MarkerEnd)
	afterBlock := content[blockEnd:]
	if strings.HasPrefix(afterBlock, "\r\n") {
		blockEnd += 2
	} else if strings.HasPrefix(afterBlock, "\n") {
		blockEnd += 1
	}

	return content[:startIdx] + content[blockEnd:]
}

func injectLoader(content string, diagnostic bool) string {
	content = stripLoader(content)

	newline := "\n"
	if strings.Contains(content, "\r\n") {
		newline = "\r\n"
	}

	scriptSrc := "cheat/cheat.js"
	diagAttr := ""
	if diagnostic {
		scriptSrc = "cheat/rmc-diagnostic.js"
		diagAttr = ";s.setAttribute('data-rmc-diagnostic','1')"
	}

	loaderBlock := fmt.Sprintf("%s%s(function(){var s=document.createElement('script');s.src='%s';%ss.async=false%s;document.head.appendChild(s);})();%s%s%s",
		MarkerStart, newline,
		scriptSrc, newline,
		diagAttr, newline,
		MarkerEnd, newline)

	// Normalize to \n for uniform line matching, then split
	normalized := strings.ReplaceAll(content, "\r\n", "\n")
	lines := strings.Split(normalized, "\n")

	insertIndex := 0
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "*") {
			continue
		}
		insertIndex = i
		break
	}

	var result strings.Builder
	for i, line := range lines {
		result.WriteString(line)
		if i < len(lines)-1 {
			result.WriteString(newline)
		}
		if i == insertIndex {
			result.WriteString(loaderBlock)
		}
	}
	return result.String()
}

func generateID() string {
	t := time.Now().UnixNano()
	return fmt.Sprintf("%x", t)[8:]
}

func getRegistryPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(configDir, "rmc-cheat-toolkit")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "installed_games.json"), nil
}

func loadRegistry() (*Registry, error) {
	regPath, err := getRegistryPath()
	if err != nil {
		return nil, err
	}

	if !fileExists(regPath) {
		return &Registry{InstalledGames: []GameConfig{}}, nil
	}

	data, err := os.ReadFile(regPath)
	if err != nil {
		return nil, err
	}

	var reg Registry
	if err := json.Unmarshal(data, &reg); err != nil {
		return nil, err
	}

	validGames := []GameConfig{}
	changed := false
	for _, g := range reg.InstalledGames {
		info, err := os.Stat(g.Path)
		if err == nil && info.IsDir() {
			validGames = append(validGames, g)
		} else {
			changed = true
		}
	}

	if changed {
		reg.InstalledGames = validGames
		_ = saveRegistry(&reg)
	}

	return &reg, nil
}

func saveRegistry(reg *Registry) error {
	regPath, err := getRegistryPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(reg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(regPath, data, 0644)
}

func registerGame(g GameConfig) error {
	reg, err := loadRegistry()
	if err != nil {
		return err
	}

	foundIdx := -1
	for i, existing := range reg.InstalledGames {
		if filepath.Clean(existing.Path) == filepath.Clean(g.Path) {
			foundIdx = i
			break
		}
	}

	if foundIdx != -1 {
		reg.InstalledGames[foundIdx] = g
	} else {
		reg.InstalledGames = append(reg.InstalledGames, g)
	}

	return saveRegistry(reg)
}

func unregisterGame(id string) error {
	reg, err := loadRegistry()
	if err != nil {
		return err
	}

	newGames := []GameConfig{}
	for _, g := range reg.InstalledGames {
		if g.ID != id {
			newGames = append(newGames, g)
		}
	}

	reg.InstalledGames = newGames
	return saveRegistry(reg)
}

func unregisterGameByPath(path string) error {
	reg, err := loadRegistry()
	if err != nil {
		return err
	}

	cleanP := filepath.Clean(path)
	newGames := []GameConfig{}
	for _, g := range reg.InstalledGames {
		if filepath.Clean(g.Path) != cleanP {
			newGames = append(newGames, g)
		}
	}

	reg.InstalledGames = newGames
	return saveRegistry(reg)
}
