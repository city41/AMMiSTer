import path from 'node:path';

/**
 * resolve() leads to an absolute path,
 * and so in that case we want OS specific paths.
 *
 * TODO: is this the right choice? Hiding the fact that resolve()
 * acts differently from all other path functions might be bad...
 *
 * The alternative is to always import normal path and use path.resolve()
 * in all files. This is more work, but also more explicit.
 */
path.posix.resolve = path.resolve;

export default path.posix;
