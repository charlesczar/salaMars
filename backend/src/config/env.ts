function resolveFrontendUrl(): string | undefined {
    const normalizeOrigin = (value: string | undefined): string | undefined => {
        if (!value) {
            return undefined;
        }

        return value.replace(/\/$/, '');
    };

    if (process.env.NODE_ENV === 'production') {
        return normalizeOrigin(process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL);
    }

    return normalizeOrigin(process.env.FRONTEND_URL_DEV || process.env.FRONTEND_URL);
}

export const envConfig = () => {
    const required = ["GEMINI_API_KEY"];

    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`ERROR: ${key} is not defined in environment variables`);
        }
    }

    if (!resolveFrontendUrl()) {
        const hint = process.env.NODE_ENV === 'production'
            ? 'FRONTEND_URL_PROD or FRONTEND_URL'
            : 'FRONTEND_URL_DEV or FRONTEND_URL';
        throw new Error(`ERROR: ${hint} is not defined in environment variables`);
    }
};

export const getFrontendUrl = () => {
    return resolveFrontendUrl()!;
};