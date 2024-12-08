
/**
 * Validates if a password meets specific criteria by matching it against a regular expression pattern. The password must contain at least one lowercase letter, one uppercase letter, one digit, one special character, and be at least 8 characters long.
 * @author Xander
 *
 * @param {*} password The password to validate
 * @returns {*} Validates a password against a regular expression pattern with specific requirements for lowercase, uppercase, digit, and special character present. The password must be at least 8 characters long.
 */
function validatePassword(password) {
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    return passwordRegex.test(password);
}

module.exports = validatePassword;
