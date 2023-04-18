/**
 * On Windows, file paths use back slashes and drive letters.
 *
 * On Linux, Mac and Mister, file paths use forward slashes and no drive letters.
 *
 * This is a very rich source of bugs when AMMister is ran on Windows.
 * Windows handles relative paths with forward slashes just fine. So this
 * file was added as a way to always do that. When doing path based operations in AMMister
 * code, you almost always want to import universalPath and not node:path.
 *
 * The exception to this is absolute paths, which are much easier done using
 * node:path and having OS specific paths. An absolute path in AMMister only
 * comes into play when doing something entirely on the PC side, such as downloading
 * a core or reading/writing a cache json file. This is accomplished by monkey patching
 * the OS specific version of resolve() onto universalPath.
 */

import path from 'node:path';

/**
 * resolve() leads to an absolute path,
 * and so in that case we want OS specific paths. This is done
 * by replacing the posix.resolve() with the OS specific resolve().
 *
 * TODO: is this the right choice? Hiding the fact that resolve()
 * acts differently from all other path functions might be bad...
 *
 * The alternative is to always import normal path and use path.resolve()
 * in all files. This is more work, but also more explicit.
 */
path.posix.resolve = path.resolve;

export default path.posix;
