const AppError = require('./AppError');
const validatePassword = require('./validatePassword');

const incidentFields = [
    'title',
    'description',
    'environment',
    'severity',
    'affectedSystems',
    'impactSummary',
    'stepsToReproduce',
    'assignedTo',
    'tags',
    'relatedLinks',
    'relatedIncidents',
    'status',
    'resolutionDetails',
];
const enums = {
    environment: ['Production', 'Staging', 'Development'],
    severity: ['Low', 'Medium', 'High', 'Critical'],
    status: ['Open', 'In Progress', 'Resolved', 'Closed'],
};
function invalid(message = 'Invalid request data.') {
    throw new AppError(message, 400);
}
function plainObject(value) {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        [Object.prototype, null].includes(Object.getPrototypeOf(value))
    );
}
function fields(data, allowed) {
    if (
        !plainObject(data) ||
        Object.keys(data).some((key) => !allowed.includes(key))
    )
        invalid();
    return { ...data };
}
function text(value, min = 0, max = 1000) {
    if (typeof value !== 'string') invalid();
    const result = value.trim();
    if (result.length < min || result.length > max) invalid();
    return result;
}
function objectId(value) {
    if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value))
        invalid();
    return value;
}
function array(value, max, validate) {
    if (!Array.isArray(value) || value.length > max) invalid();
    return value.map(validate);
}
function httpUrl(value) {
    const result = text(value, 1, 2048);
    let url;
    try {
        url = new URL(result);
    } catch {
        invalid();
    }
    if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
    )
        invalid();
    return result;
}
function password(value) {
    if (
        typeof value !== 'string' ||
        Buffer.byteLength(value, 'utf8') > 72 ||
        !validatePassword(value)
    ) {
        invalid(
            'Password must be 8–72 bytes and include uppercase, lowercase, a number and a special character.'
        );
    }
    return value;
}
function username(value) {
    return text(value, 3, 64);
}
function email(value) {
    const result = text(value, 3, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
        invalid('Invalid email address.');
    return result;
}
function incidentInput(data, update = false) {
    const result = fields(data, incidentFields);
    if (
        !update &&
        ['title', 'description', 'environment'].some(
            (key) => result[key] === undefined
        )
    )
        invalid();
    if (update && !Object.keys(result).length)
        invalid('At least one editable field is required.');
    for (const key of Object.keys(result)) {
        if (enums[key]) {
            if (
                typeof result[key] !== 'string' ||
                !enums[key].includes(result[key])
            )
                invalid();
        } else if (key === 'assignedTo') {
            result[key] =
                result[key] === null || result[key] === ''
                    ? null
                    : objectId(result[key]);
        } else if (key === 'tags')
            result[key] = array(result[key], 10, (item) => text(item, 1, 64));
        else if (key === 'relatedLinks')
            result[key] = array(result[key], 20, httpUrl);
        else if (key === 'relatedIncidents')
            result[key] = array(result[key], 20, objectId);
        else
            result[key] = text(
                result[key],
                ['title', 'description'].includes(key) ? 1 : 0,
                key === 'title' ? 200 : 1000
            );
    }
    return result;
}
function registrationInput(data) {
    const result = fields(data, ['username', 'email', 'password']);
    return {
        username: username(result.username),
        email: email(result.email),
        password: password(result.password),
    };
}
function userUpdateInput(data) {
    const result = fields(data, [
        'username',
        'email',
        'profile',
        'password',
        'currentPassword',
    ]);
    if (!Object.keys(result).length)
        invalid('At least one editable field is required.');
    if (result.username !== undefined)
        result.username = username(result.username);
    if (result.email !== undefined) result.email = email(result.email);
    if (result.profile !== undefined) {
        result.profile = fields(result.profile, ['fullName', 'avatarUrl']);
        if (!Object.keys(result.profile).length) invalid();
        if (result.profile.fullName !== undefined)
            result.profile.fullName = text(result.profile.fullName, 0, 120);
        if (result.profile.avatarUrl !== undefined) {
            result.profile.avatarUrl =
                result.profile.avatarUrl === ''
                    ? ''
                    : httpUrl(result.profile.avatarUrl);
        }
    }
    if (result.password !== undefined) {
        result.password = password(result.password);
        if (
            typeof result.currentPassword !== 'string' ||
            !result.currentPassword ||
            Buffer.byteLength(result.currentPassword) > 72
        )
            invalid('Current password is required.');
    } else if (result.currentPassword !== undefined) invalid();
    return result;
}
function validateBody(validate) {
    return (req, res, next) => {
        try {
            req.validatedBody = validate(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
}
function escapeSearchText(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
module.exports = {
    incidentFields,
    enums,
    incidentInput,
    registrationInput,
    userUpdateInput,
    validateBody,
    escapeSearchText,
    plainObject,
};
