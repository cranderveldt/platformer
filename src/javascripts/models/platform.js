export class Platform {
  constructor(pos = { x: 300, y: 100 }, size = { x: 80, y: 5 }) {
    this.pos = pos
    this.size = size
    this.stomped = false
    this.has_collision = false
  }

  getCSSProperties() {
    return { bottom: `${this.pos.y}px`, left: `${this.pos.x}px`, width: `${this.size.x}px`, height: `${this.size.y}px`, backgroundColor: this.stomped ? 'blue' : 'black' }
  }

  getCollisionObject() {
    return { top: this.pos.y + this.size.y, right: this.pos.x + this.size.x, bottom: this.pos.y, left: this.pos.x }
  }
}
