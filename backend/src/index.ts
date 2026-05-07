import "dotenv/config";
import { envConfig } from './config/env.js';

envConfig();

import app from './server.js';

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;