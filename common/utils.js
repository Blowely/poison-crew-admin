export const customUrlBuilder = (url, params) => {
  const searchParams = new URLSearchParams(params);
  let newUrl = `${url}?`;
  const arrayParams= [];
  Object.entries(params).forEach(([key, value]) => {
    if (value instanceof Array) {
      searchParams.delete(key);
      // if (value.length) {
      //   newUrl += `${key}=${value.join(',')}&`;
      // }
      if (value.length) {
        arrayParams.push(...value.map((v) => `${key}=${v}`));
      }
    } else if (!value) {
      searchParams.delete(key);
    }
  });
  newUrl += arrayParams.join('&');

  const searchString = searchParams.toString();

  const result = [newUrl];

  if (searchString) {
    result.push(decodeURIComponent(searchParams.toString()));
  }

  return result.join('&');
};


export function iosCopyToClipboard(el) {
  if (!el) {return;}
  var oldContentEditable = el.contentEditable,
    oldReadOnly = el.readOnly,
    range = document.createRange();

  el.contentEditable = true;
  el.readOnly = false;
  range.selectNodeContents(el);

  var s = window.getSelection();
  s.removeAllRanges();
  s.addRange(range);

  el.setSelectionRange(0, 999999); // A big number, to cover anything that could be inside the element.

  el.contentEditable = oldContentEditable;
  el.readOnly = oldReadOnly;

  document.execCommand('copy');
}