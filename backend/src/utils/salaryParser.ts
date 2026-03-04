export const parseSalary = (
    salary: string | null | undefined
): { min?: number; max?: number } => {
    if (!salary) {
        return {};
    }

    const sanitized = salary.replace(/[$€£]/g, '').replace(/,/g, '').replace(/(\d)k/gi, '$1000');

    const numbers = sanitized.match(/\d+/g);

    if (!numbers) {
        return {};
    }

    const numericValues = numbers.map((n) => parseInt(n, 10));

    if (numericValues.length === 1) {
        return { min: numericValues[0], max: numericValues[0] };
    }
    if (numericValues.length > 1) {
        return {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
        };
    }
    return {};
};
