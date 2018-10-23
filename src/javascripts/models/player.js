export class Player {
  constructor() {
    this.pos = { x: 0, y: 0 }
    this.vel = { x: 0, y: 0 }
    this.size = { x: 32, y: 32 }
    this.col = { x: false, y: false }
    this.dir = 0
    this.ground = true
    this.air_jump = false
    this.timestamps = {
      jump: 0,
      air_jump: 0,
    }
    this.constants = {
      acc: {
        air: 1,
        ground: 1,
      },
      max_x: 10,
      max_y: 15,
    }
    this.jump_frames = {
      current: 0,
      max: 20,
    }
  }

  getCSSPosition() {
    return { bottom: this.pos.y, left: this.pos.x }
  }

  getCollisionObject() {
    return { top: this.pos.y + this.size.y, right: this.pos.x + this.size.x, bottom: this.pos.y, left: this.pos.x }
  }

  isOnGround() {
    return this.ground
  }

  isInAir() {
    return !this.ground
  }

  hasUsedAirJump() {
    return this.air_jump
  }

  canAirJump() {
    return !this.air_jump
  }

  hasNoYCollision() {
    return !this.col.y
  }

  hasNoXCollision() {
    return !this.col.x
  }
  
  // set with constraints
  setVelX(x) {
    this.vel.x = Math.min(x, this.constants.max_x)
  }

  setVelY(y) {
    this.vel.y = Math.min(y, this.constants.max_y)
  }

  adjustVelX(x) {
    this.vel.x = Math.min(this.vel.x + x, this.constants.max_x)
  }

  adjustVelY(y) {
    this.vel.y = Math.min(this.vel.y + y, this.constants.max_y)
  }


  setPosX(x) {
    this.pos.x = x
  }

  setPosY(y) {
    this.pos.y = y
  }

  adjustPosX(x) {
    this.pos.x = this.pos.x + x
  }

  adjustPosY(y) {
    this.pos.y = this.pos.y + y
  }


  stopYMovement(pos) {
    this.setVelY(0)
    this.setPosY(pos)
  }

  stopXMovement(pos) {
    this.setVelX(0)
    this.setPosX(pos)
    this.dir = 0
  }

  reset() {
    this.pos = { x: 0, y: 0 }
    this.vel = { x: 0, y: 0 }
    this.col = { x: false, y: false }
    this.dir = 0
    this.ground = true
    this.air_jump = false
    this.timestamps = {
      jump: 0,
      air_jump: 0,
    }
    
    this.jump_frames.current = 0
  }
}
