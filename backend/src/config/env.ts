export const envConfig = () => {
    const required = ["GEMINI_API_KEY", "FRONTEND_URL_PROD"];

    // Only require DEV url outside of production
    if (process.env.NODE_ENV !== 'production') {
        required.push("FRONTEND_URL_DEV");
    }

    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`ERROR: ${key} is not defined in environment variables`);
        }
    }
};

export const getFrontendUrl = () => {
    return process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL_PROD!
        : process.env.FRONTEND_URL_DEV!;
};