import type { HttpContext } from '@adonisjs/core/http'

export default class PrivatesController {
  async index({ inertia, auth }: HttpContext) {
    return inertia.render('private', { user: auth.user! })
  }
}
