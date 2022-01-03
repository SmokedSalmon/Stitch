import { MFEService } from '@stitch/types'

const deepFreeze = obj => {
  Object.keys(obj).forEach(prop => {
    if (typeof obj[prop] === 'object') deepFreeze(obj[prop])
  })
  return Object.freeze(obj)
}

/**
   * @implements CustomizedService
   */
class UserProfileService extends MFEService {
  #userProfile

  static NAME = 'user_profile_service'

  constructor (userProfile) {
    super()

    if (!userProfile) throw new Error(`the user profile is ${userProfile}, it should be a object`)
    if (typeof userProfile !== 'object') throw new Error('the user profile should be a object')
    this.#userProfile = userProfile

    deepFreeze(this)
  }

  getUserProfile () {
    return this.#userProfile
  }
}

export default UserProfileService
