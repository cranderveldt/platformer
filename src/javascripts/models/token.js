export class Token {
  constructor(pos = { x: 300, y: 100 }) {
    this.pos = pos
    this.size = { x: 24, y: 24 }
    this.type = "time_loss"
  }

  getTokenTypeClass() {
    return "fa-clock-o"
  }

  getTokenTypeColor() {
    return "red"
  }

  getCSSProperties() {
    return { bottom: `${this.pos.y}px`, left: `${this.pos.x}px`, width: `${this.size.x}px`, height: `${this.size.y}px`, color: this.getTokenTypeColor() }
  }

  getCollisionObject() {
    return { top: this.pos.y + this.size.y, right: this.pos.x + this.size.x, bottom: this.pos.y, left: this.pos.x }
  }
}
