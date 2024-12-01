/**
 * Claude (Anthropic) Provider Implementation
 */

class ClaudeProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1';
    }

    async generateResponse(prompt, options = {}) {
        const defaultOptions = {
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0.7,
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            messages: [{ role: 'user', content: prompt }],
        };

        const response = await UrlFetchApp.fetch(`${this.baseUrl}/messages`, {
            method: 'post',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            payload: JSON.stringify(requestOptions),
            muteHttpExceptions: true,
        });

        const result = JSON.parse(response.getContentText());
        if (response.getResponseCode() !== 200) {
            throw new Error(`Claude API Error: ${result.error?.message || 'Unknown error'}`);
        }

        return result.content[0].text;
    }
}
