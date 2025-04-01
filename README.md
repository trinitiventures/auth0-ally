# Auth0 Ally Driver
> A custom AdonisJS Ally driver for integrating with Auth0

This repo provides a custom OAuth2 driver for [AdonisJS ally](https://docs.adonisjs.com/guides/authentication/social-authentication) to integrate with Auth0.

## Getting started

Follow these steps to get started:

1. Fork this repo and clone it to your local machine.
2. Install all dependencies using `npm`, `pnpm`, or `yarn` (whichever you prefer).
3. Open the `package.json` file and update the `name`, `description`, and `author` details.

   ```json
   {
     "name": "auth0-ally-driver",
     "description": "Custom AdonisJS Ally driver for Auth0",
     "author": "Your Name"
   }
   ```

4. Configure your Auth0 application:
   - Go to your Auth0 dashboard and create a new application.
   - Set the callback URL to match your AdonisJS application's callback route (e.g., `http://localhost:3333/ally/auth0/callback`).
   - Note down the `Client ID`, `Client Secret`, and `Domain` (used for `authorizeUrl`, `accessTokenUrl`, and `userInfoUrl`).

## How is the code structured?

The code for the driver is inside the `src` directory. The `Auth0Driver` class implements the necessary methods to integrate with Auth0's OAuth2 API.

### Key URLs for Auth0

- **Authorize URL**: `https://YOUR_AUTH0_DOMAIN/authorize`
- **Access Token URL**: `https://YOUR_AUTH0_DOMAIN/oauth/token`
- **User Info URL**: `https://YOUR_AUTH0_DOMAIN/userinfo`

Replace `YOUR_AUTH0_DOMAIN` with your Auth0 tenant domain (e.g., `dev-abc123.us.auth0.com`).

### Configuration

The `Auth0DriverConfig` type defines the configuration options required by the driver:

```ts
export type Auth0DriverConfig = {
  driver: 'auth0',
  clientId: string,
  clientSecret: string,
  callbackUrl: string,
  authorizeUrl?: string,
  accessTokenUrl?: string,
  userInfoUrl?: string,
  scopes?: Auth0DriverScopes[]
}
```

### Driver Implementation

The `Auth0Driver` class extends the base `Oauth2Driver` class and implements the following:

- `authorizeUrl`: The URL for redirecting users to Auth0 for authorization.
- `accessTokenUrl`: The URL for exchanging the authorization code for an access token.
- `userInfoUrl`: The URL for fetching user profile information.
- `user`: Fetches the user details and access token after authorization.
- `userFromToken`: Fetches user details using an existing access token.

## Development checklist

- [x] Defined the `authorizeUrl` class property.
- [x] Defined the `accessTokenUrl` class property.
- [x] Defined the `userInfoUrl` class property.
- [x] Implemented the `accessDenied` class method.
- [x] Implemented the `user` class method.
- [x] Implemented the `userFromToken` class method.

## Testing the driver

You can test the driver by installing it locally in your AdonisJS application. Follow these steps:

1. Compile the TypeScript code to JavaScript using the `npm run build` script.
2. Navigate to your AdonisJS project and install the package locally using:
   ```bash
   npm i path/to/your/driver/package
   ```
3. Reference the driver in your `config/ally.ts` file:

   ```ts
   import Env from '@ioc:Adonis/Core/Env'
   import { Auth0DriverService } from 'auth0-ally-driver'

   export default {
     auth0: Auth0DriverService({
       clientId: Env.get('AUTH0_CLIENT_ID'),
       clientSecret: Env.get('AUTH0_CLIENT_SECRET'),
       callbackUrl: Env.get('AUTH0_CALLBACK_URL'),
       authorizeUrl: `https://${Env.get('AUTH0_DOMAIN')}/authorize`,
       accessTokenUrl: `https://${Env.get('AUTH0_DOMAIN')}/oauth/token`,
       userInfoUrl: `https://${Env.get('AUTH0_DOMAIN')}/userinfo`,
     }),
   }
   ```

4. Add the necessary environment variables to your `.env` file:
   ```env
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_CALLBACK_URL=http://localhost:3333/ally/auth0/callback
   AUTH0_DOMAIN=your-auth0-domain
   ```

## FAQ's

### How do I define extra params during redirect?

You can configure the redirect request by implementing the `configureRedirectRequest` method on the driver class:

```ts
protected configureRedirectRequest(request: RedirectRequest<Auth0DriverScopes>) {
  request.param('audience', 'https://YOUR_AUTH0_API_IDENTIFIER')
}
```

### How do I define extra fields/params for the access token request?

You can configure the access token request by implementing the `configureAccessTokenRequest` method on the driver class:

```ts
protected configureAccessTokenRequest(request: ApiRequest) {
  request.field('audience', 'https://YOUR_AUTH0_API_IDENTIFIER')
}
```

## Share with others

If you find this driver useful, consider sharing it with the community by submitting it to the [awesome-adonisjs](https://github.com/adonisjs-community/awesome-adonisjs) repoß
