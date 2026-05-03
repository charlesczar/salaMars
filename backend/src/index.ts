import "dotenv/config";
import { envConfig } from './config/env.js';

envConfig();

import app from './server.js';

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});