import { defineConfig } from '@adonisjs/ally'
import env from '#start/env'
import { Auth0DriverService } from '@trinitiventures/auth0-ally'

const allyConfig = defineConfig({
  auth0: Auth0DriverService({
    clientId: env.get('AUTH0_CLIENT_ID'),
    clientSecret: env.get('AUTH0_CLIENT_SECRET'),
    domain: env.get('AUTH0_DOMAIN'),
    callbackUrl: env.get('AUTH0_CALLBACK_URL'),
    authorizeUrl: `https://${env.get('AUTH0_DOMAIN')}/authorize`,
    accessTokenUrl: `https://${env.get('AUTH0_DOMAIN')}/oauth/token`,
    userInfoUrl: `https://${env.get('AUTH0_DOMAIN')}/userinfo`,
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
