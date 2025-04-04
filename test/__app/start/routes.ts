/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { HttpContext } from '@adonisjs/core/http'

const PrivateController = () => import('#controllers/private_controller')
const AuthController = () => import('#controllers/auth_controller')

router.on('/').renderInertia('home')

router.get('/login', async ({ ally }: HttpContext) => {
  return ally.use('auth0').redirect()
})

router.get('/auth/callback', [AuthController, 'callback'])
router.get('/auth/logout', [AuthController, 'logout']).use(middleware.auth())

router.get('/private', [PrivateController, 'index']).use(middleware.auth())
