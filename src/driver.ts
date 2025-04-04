import { ApiRequest, Oauth2Driver, RedirectRequest } from '@adonisjs/ally'
import type { HttpContext } from '@adonisjs/core/http'
import type { AllyDriverContract, AllyUserContract, ApiRequestContract } from '@adonisjs/ally/types'
import { ManagementClient } from 'auth0'

/**
 *
 * Access token returned by your driver implementation. An access
 * token must have "token" and "type" properties and you may
 * define additional properties (if needed)
 */
export type Auth0DriverAccessToken = {
  token: string
  type: 'bearer'
}

/**
 * Scopes accepted by the driver implementation.
 */
export type Auth0DriverScopes = 'openid' | 'profile' | 'email' | 'offline_access' | (string & {})

/**
 * The configuration accepted by the driver implementation.
 */
export type Auth0DriverConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
  domain: string
  authorizeUrl?: string
  accessTokenUrl?: string
  userInfoUrl?: string
  logoutUrl?: string
  scopes?: Auth0DriverScopes[]
}

/**
 * Driver implementation. It is mostly configuration driven except the API call
 * to get user info.
 */
export class Auth0Driver
  extends Oauth2Driver<Auth0DriverAccessToken, Auth0DriverScopes>
  implements AllyDriverContract<Auth0DriverAccessToken, Auth0DriverScopes>
{
  /**
   * The URL for the redirect request. The user will be redirected on this page
   * to authorize the request.
   *
   * Do not define query strings in this URL.
   */
  protected authorizeUrl = ''

  /**
   * The URL to hit to exchange the authorization code for the access token
   *
   * Do not define query strings in this URL.
   */
  protected accessTokenUrl = ''

  /**
   * The URL to hit to get the user details
   *
   * Do not define query strings in this URL.
   */
  protected userInfoUrl = ''

  /**
   * The URL to redirect to after logout
   *
   * Do not define query strings in this URL.
   */
  protected logoutUrl = ''

  /**
   * The param name for the authorization code. Read the documentation of your oauth
   * provider and update the param name to match the query string field name in
   * which the oauth provider sends the authorization_code post redirect.
   */
  protected codeParamName = 'code'

  /**
   * The param name for the error. Read the documentation of your oauth provider and update
   * the param name to match the query string field name in which the oauth provider sends
   * the error post redirect
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token. Make sure it is always unique. So a better
   * approach is to prefix the oauth provider name to `oauth_state` value. For example:
   * For example: "facebook_oauth_state"
   */
  protected stateCookieName = 'auth0_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   * Read the documentation of your oauth provider and update the param
   * name to match the query string used by the provider for exchanging
   * the state.
   */
  protected stateParamName = 'state'

  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  constructor(
    ctx: HttpContext,
    public config: Auth0DriverConfig
  ) {
    super(ctx, config)

    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     *
     * DO NOT REMOVE THE FOLLOWING LINE
     */
    this.loadState()
  }

  protected getAuthenticatedRequest(url: string, token: string): ApiRequest {
    const request = this.httpClient(url)
    request.header('Authorization', `Bearer ${token}`)
    request.header('Accept', 'application/json')
    request.parseAs('json')
    return request
  }

  protected async getUserInfo(token: string, callback?: (request: ApiRequestContract) => void) {
    const request = this.getAuthenticatedRequest(this.config.userInfoUrl || this.userInfoUrl, token)

    if (typeof callback === 'function') {
      callback(request)
    }

    const userInfo = await request.get()

    return {
      id: userInfo.sub,
      nickName: userInfo.nickname || '',
      firstName: userInfo.given_name || '',
      lastName: userInfo.family_name || '',
      name: userInfo.name || '',
      email: userInfo.email || '',
      emailVerificationState: userInfo.email_verified
        ? ('verified' as const)
        : ('unverified' as const),
      avatarUrl: userInfo.picture || '',
      original: userInfo, // Include the full user info response
    }
  }

  /**
   * Optionally configure the authorization redirect request. The actual request
   * is made by the base implementation of "Oauth2" driver and this is a
   * hook to pre-configure the request.
   */
  protected configureRedirectRequest(request: RedirectRequest<Auth0DriverScopes>) {
    request.scopes(this.config.scopes || ['openid', 'profile', 'email'])
    request.param('response_type', 'code')
    request.param('grant_type', 'authorization_code')
  }

  /**
   * Optionally configure the access token request. The actual request is made by
   * the base implementation of "Oauth2" driver and this is a hook to pre-configure
   * the request
   */
  // protected configureAccessTokenRequest(request: ApiRequest) {}

  /**
   * Update the implementation to tell if the error received during redirect
   * means "ACCESS DENIED".
   */
  accessDenied() {
    const error = this.getError()
    if (!error) {
      return false
    }

    return error === 'access_denied'
  }

  /**
   * Get the user details by query the provider API. This method must return
   * both the access token and the user details. Checkout the google
   * implementation for same.
   *
   * https://github.com/adonisjs/ally/blob/develop/src/Drivers/Google/index.ts#L191-L199
   */
  async user(
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<Auth0DriverAccessToken>> {
    const token = await this.accessToken(callback)
    const user = await this.getUserInfo(token.token, callback)

    return {
      ...user,
      token,
    }
  }

  async userFromToken(
    accessToken: string,
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<{ token: string; type: 'bearer' }>> {
    const user = await this.getUserInfo(accessToken, callback)

    return {
      ...user,
      token: { token: accessToken, type: 'bearer' as const },
    }
  }

  /**
   * Logout the user from Auth0
   *
   * @param returnTo The URL to redirect to after logout
   * @param userId Optional Auth0 user ID to invalidate all sessions
   */
  async logout(returnTo?: string, userId?: string): Promise<string> {
    const logoutUrl =
      this.config.logoutUrl || this.logoutUrl || `https://${this.config.domain}/v2/logout`

    console.log('Starting logout process with URL:', logoutUrl)

    // Build the Auth0 logout URL
    const url = new URL(logoutUrl)
    url.searchParams.append('client_id', this.config.clientId)

    if (returnTo) {
      url.searchParams.append('returnTo', returnTo)
    }

    // If a userId is provided, we'll use the Management API to invalidate all sessions
    if (userId) {
      console.log('User ID provided, invalidating all sessions for user:', userId)
      try {
        const auth0 = new ManagementClient({
          domain: this.config.domain,
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
        })

        // Invalidate all sessions for the user
        await auth0.users.invalidateRememberBrowser({ id: userId })
      } catch (error) {
        console.error('Failed to invalidate Auth0 sessions:', error)
      }
    }

    console.log('Returning Auth0 logout URL: %s', url.toString())

    return url.toString()
  }
}

/**
 * The factory function to reference the driver implementation
 * inside the "config/ally.ts" file.
 */
export function Auth0DriverService(config: Auth0DriverConfig): (ctx: HttpContext) => Auth0Driver {
  return (ctx) => new Auth0Driver(ctx, config)
}
