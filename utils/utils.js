export const decryptToken = (token) => {
  if (!token) {
    return {};
  }

  const decryptedToken = atob(token);
  const tokenData = decryptedToken.split(':');
  const phone = tokenData[0];
  const code = tokenData[1];

  return {phone, code};
}