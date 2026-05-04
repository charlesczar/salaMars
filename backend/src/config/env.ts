export const envConfig = () => {
    const required = ["PORT", "GEMINI_API_KEY", "FRONTEND_URL"];
    
    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`ERROR: ${key} is not defined in environment variables`);
        }
    }
};
