// Our own short strings with a setting or command named in backticks, as the docs write them:
// `code()` sets those names as code for a page, `bare()` drops the backticks for words read aloud or written plain.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const code = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
export const bare = (s) => s.replace(/`([^`]+)`/g, '$1');
