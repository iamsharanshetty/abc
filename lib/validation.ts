export const validateUrl = (value: string): string => {
    if (!value) return "Please enter a URL"
    try {
        const urlObject = new URL(value.startsWith("http") ? value : `https://${value}`)
        if (!urlObject.hostname.includes(".")) {
            return "Please enter a valid URL (e.g., example.com)"
        }
        return ""
    } catch {
        return "Please enter a valid URL (e.g., example.com)"
    }
}
