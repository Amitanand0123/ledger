/**
 * A utility function to parse a salary string and extract minimum and maximum numeric values.
 * This allows for flexible user input (e.g., "$120k", "100,000 - 130,000", "up to 95k/year")
 * while enabling structured, numeric range filtering.
 *
 * @param salary - The salary string to parse. Can be null or undefined.
 * @returns An object containing `min` and `max` numeric values, or an empty object if no numbers are found.
 */
export const parseSalary = (
    salary: string | null | undefined
): { min?: number; max?: number } => {
    // If the input is null, undefined, or an empty string, return immediately.
    if (!salary) {
        return {};
    }

    // Step 1: Sanitize the string.
    // - Remove common currency symbols ($, €, £, etc.).
    // - Remove commas used as thousands separators.
    // - Case-insensitively replace 'k' with '000' to handle shorthand like "120k".
    const sanitized = salary.replace(/[\$,€,£]/g, '').replace(/,/g, '').replace(/k/gi, '000');

    // Step 2: Use a regular expression to find all sequences of digits.
    // The 'g' flag ensures we find all occurrences, not just the first one.
    const numbers = sanitized.match(/\d+/g);

    // If no numbers were found in the string, there's nothing to parse.
    if (!numbers) {
        return {};
    }

    // Step 3: Convert the found string numbers into actual numeric values.
    const numericValues = numbers.map((n) => parseInt(n, 10));

    // Step 4: Determine the min and max values.
    // If only one number was found, it's both the min and the max.
    if (numericValues.length === 1) {
        return { min: numericValues[0], max: numericValues[0] };
    }

    // If multiple numbers were found (e.g., in a range like "100,000 - 120,000"),
    // find the mathematical minimum and maximum.
    if (numericValues.length > 1) {
        return {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
        };
    }

    // Fallback case, though it's unlikely to be reached with the logic above.
    return {};
};