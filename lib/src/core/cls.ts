export type ClassValue = string | { [key: string]: boolean } | null | undefined;

export function cls(...args: ClassValue[]): string {
    const classes: string[] = [];

    for (const arg of args) {
        if (!arg) {
            continue;
        }

        if (typeof arg === "string") {
            classes.push(arg);
        } else if (typeof arg === "object") {
            for (const key in arg) {
                if (Object.hasOwn(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }

    return classes.join(" ");
}
