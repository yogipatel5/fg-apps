/**
 * Utility functions for AI Helper Library
 */

const AIUtils = {
    summarizeText: async function (text, provider = 'openai') {
        const ai = createAIHelper(provider);
        return ai.generateResponse(`Summarize the following text: ${text}`);
    },

    generateCode: async function (prompt, provider = 'openai') {
        const ai = createAIHelper(provider);
        return ai.generateResponse(`Generate code for: ${prompt}`);
    }
};

function handleAIError(error) {
    console.error('AI Helper Error:', error);
    throw new Error(`AI Helper Error: ${error.message}`);
}
