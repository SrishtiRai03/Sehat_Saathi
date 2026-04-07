export const logoutUser = () => {
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear cookies (this is the "secret sauce" to un-sticking the portals)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Redirect to landing page and force a full browser refresh
  window.location.href = "/"; 
};
