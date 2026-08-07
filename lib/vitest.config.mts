import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineProject } from "vitest/config";
import { playwrightCommands } from "vitest-browser-commands";


export default defineProject ({
    plugins: [react(), playwrightCommands()],
    test: {
        name: "lib-tests",
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
                {
                    browser: "chromium",
                },
            ],
            viewport: { width: 1000, height: 1000 },
        },
    }
});
