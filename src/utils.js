import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getImportFilePath = () => {
    const dir = path.join(__dirname, "../imports");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return path.join(dir, "users.json");
};
