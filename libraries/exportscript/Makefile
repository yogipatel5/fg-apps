# Makefile for Export Script Library

# Colors for better visibility
YELLOW := \033[1;33m
GREEN := \033[1;32m
NC := \033[0m # No Color

.PHONY: help install login pull push watch deploy-prod deploy-dev status create-version

help:
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "$(GREEN)make help$(NC)           - Show this help message"
	@echo "$(GREEN)make install$(NC)        - Install clasp globally"
	@echo "$(GREEN)make login$(NC)          - Login to Google account"
	@echo "$(GREEN)make pull$(NC)           - Pull latest changes from script project"
	@echo "$(GREEN)make push$(NC)           - Push changes to dev branch"
	@echo "$(GREEN)make watch$(NC)          - Start watch mode for development"
	@echo "$(GREEN)make deploy-prod$(NC)    - Deploy to production (main branch)"
	@echo "$(GREEN)make deploy-dev$(NC)     - Deploy to development branch"
	@echo "$(GREEN)make status$(NC)         - Check project status"
	@echo "$(GREEN)make create-version$(NC) - Create new version"

install:
	@echo "$(YELLOW)Installing clasp globally...$(NC)"
	npm install -g @google/clasp

login:
	@echo "$(YELLOW)Logging into Google account...$(NC)"
	clasp login

pull:
	@echo "$(YELLOW)Pulling latest changes...$(NC)"
	git checkout dev
	clasp pull

push:
	@echo "$(YELLOW)Pushing changes to dev branch...$(NC)"
	git checkout dev
	clasp push

watch:
	@echo "$(YELLOW)Starting watch mode on dev branch...$(NC)"
	git checkout dev
	clasp push --watch

# Deployment ID for Version 1
DEPLOYMENT_ID := AKfycbwx0CO579OAZBcB5cgMSXJ1pO0Ddy2RQL6JWVTzyRlMKJ17GNIlqO5RzPrwE6TEJwUP

# Deploy to "live" version 1 with new changes
deploy-prod:
	@if [ -z "$(msg)" ]; then \
		echo "Error: Provide a description for the version using 'make deploy-prod msg=\"Your message\"'"; \
		exit 1; \
	fi
	clasp version "$(msg)"
	@latest_version=$$(clasp versions | tail -1 | awk '{print $$1}'); \
	clasp deploy -i $(DEPLOYMENT_ID) -V $$latest_version; \
	echo "Redeployed Version $$latest_version to live Version 1 (Deployment ID: $(DEPLOYMENT_ID))"


deploy-dev:
	@echo "$(YELLOW)Deploying to development...$(NC)"
	git checkout dev
	clasp push

status:
	@echo "$(YELLOW)Checking project status...$(NC)"
	clasp status

create-version:
	@echo "$(YELLOW)Creating new version...$(NC)"
	clasp version "Version $$(date '+%Y-%m-%d %H:%M:%S')"

# Command for deploying app script to production
deploy-prod: