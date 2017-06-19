# OS Moderator Authentication

OS Moderator leverages a Google OAuth 2 authentication flow to trade on our server for JWT tokens.  The following outlines how it all works.

## Google OAuth Flow

Google OAuth (version 2) is used to actually authenticate users. [Passport](https://github.com/jaredhanson/passport) and [passport-google-oauth2](https://github.com/jaredhanson/passport-google-oauth2) are used on the backend and, upon receiving and verifying the access token:

1. A unique `User` model instance based on the email address, is created or retrieved
2. A unique `UserSocialAuth` model instance for the user / provider / provider id is created or retrieved
3. A JWT token is created and the user is redirected to the homepage with it in the query string, like: `/?token=(token string)`

## Protecting Resources

To make an endpoint require a valid JWT token, pass in Passport authentication middleware like so:

```js
router.get(
    '/some/protected/path',
    passport.authenticate('jwt', {session: false}),
    (request, response) => {
        response.send('Some private stuff!');
    });
```

The JWT provider fetches and verifies the user encoded in the token with every request (see the `verify` function in `server/domain/auth/providers/jwt.ts`) and Passport makes a `user` object (a `User` Sequelize model instance) on the `request` object.

## Logging In

To log in, navigate to `/auth/login/google` and it will kick off the OAuth process with Google. You can optionally pass a `redirect` query string parameter of an encoded URL (e.g `encodeURIComponent('http://radsite.com')`) and it will be redirected to on successful login with a `token` query string parameter tacked on to it.

## Accessing Protected Resources

To use your JWT token to access protected resources, you must pass it into the `Authorization` HTTP header like so: `Authorization: JWT (token string)`.

## Token Expiration

Tokens expire for human users (as opposed to users whose `group` is set to `service`, which do not expire) after the number of minutes set in the configuration value `token_expiration_minutes` (`server/config/index.js`). The expiration is calculated server-side based on the `iat` (issued at timestamp) embedded in the token.

## Removing/Deactivating users

To remove/deactivate users, there is a simple `isActive` boolean field, which you can set to `false`/`0`. As long as the user record remains in the `users` table, the user should not be able to reauthenticate.
