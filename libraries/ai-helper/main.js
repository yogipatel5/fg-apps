/**
 * AI Helper Library - Main Entry Point
 * A centralized library for handling AI model interactions across different Google Apps Script projects
 */

// Configuration management
const CONFIG = {
    OPENAI_API_KEY: PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY'),
    ANTHROPIC_API_KEY: PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY'),
};

class AIHelper {
    constructor(provider = 'openai') {
        this.provider = provider.toLowerCase();
        this.providerInstance = this.initializeProvider();
    }

    initializeProvider() {
        switch (this.provider) {
            case 'openai':
                return new OpenAIProvider(CONFIG.OPENAI_API_KEY);
            case 'claude':
                return new ClaudeProvider(CONFIG.ANTHROPIC_API_KEY);
            default:
                throw new Error(`Unsupported AI provider: ${this.provider}`);
        }
    }

    async generateResponse(prompt, options = {}) {
        try {
            return await this.providerInstance.generateResponse(prompt, options);
        } catch (error) {
            handleAIError(error);
        }
    }
}

// Global function to create AI Helper instance
function createAIHelper(provider) {
    return new AIHelper(provider);
}