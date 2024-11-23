# Makefile for Google Apps Script Projects - FlavorGod

# Colors for better visibility
YELLOW := \033[1;33m
GREEN := \033[1;32m
NC := \033[0m # No Color

# Script directories
SCRIPT_DIRS := libraries/fg-helpers libraries/exportscript

.PHONY: help pull push watch install status create-versions

help:
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "$(GREEN)make help$(NC)           - Show this help message"
	@echo "$(GREEN)make pull$(NC)           - Pull latest changes from all script projects"
	@echo "$(GREEN)make push$(NC)           - Push changes to all script projects"
	@echo "$(GREEN)make watch$(NC)          - Start watch mode for all script projects"
	@echo "$(GREEN)make install$(NC)        - Install clasp globally and login"
	@echo "$(GREEN)make status$(NC)         - Check status of all script projects"
	@echo "$(GREEN)make create-versions$(NC) - Create new versions for all script projects"

# Pull latest changes from all script projects
pull:
	@echo "$(YELLOW)Pulling latest changes from all projects...$(NC)"
	@for dir in $(SCRIPT_DIRS); do \
		echo "$(GREEN)Pulling $$dir...$(NC)"; \
		cd $$dir && clasp pull && cd ../..; \
	done

# Push changes to all script projects
push:
	@echo "$(YELLOW)Pushing changes to all projects...$(NC)"
	@for dir in $(SCRIPT_DIRS); do \
		echo "$(GREEN)Pushing $$dir...$(NC)"; \
		cd $$dir && clasp push && cd ../..; \
	done

# Start watch mode for a specific project
# Usage: make watch DIR=libraries/fg-helpers
watch:
	@if [ -z "$(DIR)" ]; then \
		echo "$(YELLOW)Please specify a directory with DIR=path/to/directory$(NC)"; \
		echo "Example: make watch DIR=libraries/fg-helpers"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Starting watch mode for $(DIR)...$(NC)"
	@cd $(DIR) && clasp push --watch

# Install clasp globally and login
install:
	@echo "$(YELLOW)Installing clasp globally and logging in...$(NC)"
	npm install -g @google/clasp
	clasp login

# Check status of all script projects
status:
	@echo "$(YELLOW)Checking status of all projects...$(NC)"
	@for dir in $(SCRIPT_DIRS); do \
		echo "$(GREEN)Status for $$dir:$(NC)"; \
		cd $$dir && clasp status && cd ../..; \
	done

# Create new versions for all script projects
create-versions:
	@echo "$(YELLOW)Creating new versions for all projects...$(NC)"
	@for dir in $(SCRIPT_DIRS); do \
		echo "$(GREEN)Creating version for $$dir...$(NC)"; \
		cd $$dir && clasp version "Auto version $$(date '+%Y-%m-%d %H:%M:%S')" && cd ../..; \
	done