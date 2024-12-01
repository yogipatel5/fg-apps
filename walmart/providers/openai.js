/**
 * OpenAI Provider Implementation
 */

class OpenAIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
    }

    async generateResponse(prompt, options = {}) {
        const defaultOptions = {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 1000,
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            messages: [{ role: 'user', content: prompt }],
        };

        const response = await UrlFetchApp.fetch(`${this.baseUrl}/chat/completions`, {
            method: 'post',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            payload: JSON.stringify(requestOptions),
            muteHttpExceptions: true,
        });

        const result = JSON.parse(response.getContentText());
        if (response.getResponseCode() !== 200) {
            throw new Error(`OpenAI API Error: ${result.error?.message || 'Unknown error'}`);
        }

        return result.choices[0].message.content;
    }
}
