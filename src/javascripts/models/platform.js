export class Platform {
  constructor(pos = { x: 300, y: 100 }, size = { x: 80, y: 5 }) {
    this.pos = pos
    this.size = size
    this.stomped = false
    this.has_collision = false
  }

  getCSSProperties() {
    return { bottom: this.pos.y, left: this.pos.x, width: this.size.x, height: this.size.y, backgroundColor: this.stomped ? 'blue' : 'black' }
  }

  getCollisionObject() {
    return { top: this.pos.y + this.size.y, right: this.pos.x + this.size.x, bottom: this.pos.y, left: this.pos.x }
  }
}
