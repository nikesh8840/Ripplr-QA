const loginLocators = (page) => ({
    usernameInput:  page.getByRole('textbox', { name: 'User ID User ID' }),
    passwordInput:  page.getByRole('textbox', { name: 'Password Password' }),
    loginButton:    page.getByRole('button', { name: 'Login' }),
});

module.exports = loginLocators;
