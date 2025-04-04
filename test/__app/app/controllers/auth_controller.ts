import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import User from '#models/user'

export default class AuthController {
  async callback({ ally, auth, response }: HttpContext) {
    const auth0 = ally.use('auth0')

    // Check if we have an error during OAuth authentication
    if (auth0.hasError() || auth0.accessDenied()) {
      logger.error('Error during authentication: %s', auth0.getError())
      return response.redirect().toRoute('/')
    }

    // Get user details from auth0
    const auth0User = await auth0.user()

    logger.info('Auth0 user original: %o', auth0User.original)
    logger.info('\n')
    logger.info('Auth0 user normalised: %o', auth0User)

    // Here you can:
    // 1. Find or create a user in your database
    // 2. Set the session information
    // 3. Redirect to the appropriate page

    const user = await User.updateOrCreate(
      { id: auth0User.id },
      { id: auth0User.id, email: auth0User.email! }
    )

    await auth.use('web').login(user)

    logger.info('User logged in: %o', user)
    logger.info('Redirecting to private route')

    return response.redirect().toRoute('/private')
  }

  async logout({ ally, auth, response }: HttpContext) {
    const logoutUrl = await ally.use('auth0').logout('http://localhost:3333')
    await auth.use('web').logout()
    return response.redirect(logoutUrl)
  }
}
