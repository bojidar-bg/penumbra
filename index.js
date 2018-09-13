const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const levels = [
  {
    walls: [
      [0, 4, 40, 2],
      [10, 4, 4],
    ],
    enemies: [
      [0, 25],
    ],
    start: [0, 0],
    goal: [35, 0],
    texts: [
      [0, -10, 'Hello stranger!'],
      [0, -5, 'Get to the green square to continue (A/D/Left/Right)']
    ]
  },
  {
    walls: [
      [0, 0, 18, 2],
      [0, 10, 18, 2],
    ],
    start: [0, -10],
    goal: [0, 5],
    texts: [
      [0, -10, 'Use your mouse to create shadows'],
    ]
  },
  {
    walls: [
      [-20, 10, 18, 2],
      [20, 2, 18, 2],
      [42, -2, 2, 2],
    ],
    start: [-20, 0],
    goal: [42, -6],
    texts: [
      [0, -10, 'Try making a ramp to jump'],
    ]
  },
  {
    walls: [
      [0, 27, 40, 25],
    ],
    start: [0, 0],
    goal: [35, -25],
    texts: [
      [25, -5, 'Try making a shadow here'],
      [25, 0, 'V'],
    ]
  },
  {
    walls: [
      [0, 25, 28, 3],
      [25, 0, 3, 28],
    ],
    start: [0, 17],
    goal: [35, 0],
    texts: [
      [0, 0, 'Elevator!'],
    ]
  }
]
const playerSize = 2
const acceleration = 4
const decay = 0.001
const friction = 0.004
const gravity = 2
const follow = 0.2
const umbraSize = 10
const enemySize = 2
const enemyAcceleration = 3
const eps = 0.01

let input = {
  left: 0,
  right: 0,
  up: 0,
  down: 0,
  mouseX: 0,
  mouseY: -50,
}
const mappings = {
  32: 'up',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'left',
  68: 'right',
}

let state = {
  level: -1,
  player: [0, 0, 0, 0],
  particles: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  enemies: [],
  umbra: [0, 0]
}

let gradients = []

function gradientJumble(func, args) {
  context.fillStyle = 'rgb(242, 242, 242)'
  func.apply(this, args)
  for (let gradient of gradients) {
    context.fillStyle = gradient
    func.apply(this, args)
  }
}

function rectangle([x, y], [extentX, extentY], rotation = 0) {
  context.translate(x, y)
  context.rotate(rotation)
  context.fillRect(- extentX, - extentY, extentX * 2, extentY * 2)
  context.rotate(-rotation)
  context.translate(-x, -y)
}

function triangle([x, y], [sizeX, sizeY], rotation = 0) {
  context.translate(x, y)
  context.rotate(rotation)
  context.beginPath()
  context.moveTo(sizeX, 0)
  context.lineTo(- sizeX, - sizeY)
  context.lineTo(- sizeX, sizeY)
  context.closePath()
  context.fill()
  context.rotate(-rotation)
  context.translate(-x, -y)
}

function circle([x, y], radius) {
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
}

function regenerateGradients() {
  gradients = []
  for (var i = 0; i < 2; i++) {
    let gradient = context.createLinearGradient(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50)
    gradient.addColorStop(0, 'hsla(' + Math.random() * 360 + ', 100%, 92%, 1.0)')
    gradient.addColorStop(1, 'hsla(' + Math.random() * 360 + ', 100%, 92%, 0.0)')
    gradients.push(gradient)
  }
}

function nextLevel() {
  state.level ++
  resetPlayer()
  state.particles = Array(50).fill().map(() => [state.player[0], state.player[1]])
  state.enemies = (levels[state.level].enemies || []).map(enemy => [enemy[0], enemy[1], 0, 0])
  regenerateGradients()
}

function resetPlayer() {
  state.player = [levels[state.level].start[0], levels[state.level].start[1], 0, 0]
}

function draw() {
  context.save()

  context.fillStyle = 'rgb(32, 12, 38)'
  rectangle([canvas.width / 2, canvas.height / 2], [canvas.width / 2, canvas.height / 2])

  let minSide = Math.min(canvas.width, canvas.height)
  context.setTransform(minSide / 100, 0, 0, minSide / 100, canvas.width / 2, canvas.height / 2)
  // context.translate(-state.player[0], -state.player[1])

  for (let levelPart of levels[state.level].walls) {
    if (levelPart.length == 3) {
      gradientJumble(circle, [[levelPart[0], levelPart[1]], levelPart[2]])
    } else if (levelPart.length == 4 || levelPart.length == 5) {
      gradientJumble(rectangle, [[levelPart[0], levelPart[1]], [levelPart[2], levelPart[3]], levelPart[4]])
    }
  }

  context.fillStyle = 'rgb(170, 170, 170)'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '40px sans'
  for (let text of levels[state.level].texts || []) {
    context.translate(text[0], text[1])
    context.scale(100 / minSide, 100 / minSide)
    context.fillText(text[2], text[0], text[1])
    context.scale(minSide / 100, minSide / 100)
    context.translate(-text[0], -text[1])
  }

  context.fillStyle = 'rgb(242, 35, 110)'
  for (var i = 0; i < state.enemies.length; i++) {
    triangle(state.enemies[i], [enemySize, enemySize], Math.atan2(state.enemies[i][3], state.enemies[i][2]))
  }

  context.fillStyle = 'rgb(32, 12, 38)'
  context.fillStyle = 'rgb(170, 170, 170)'
  circle(state.umbra, umbraSize)

  context.fillStyle = 'rgb(116, 210, 32)'
  rectangle(levels[state.level].goal, [2, 2])

  // for (var i = -50; i <= 50; i++) {
  //   for (var j = -50; j <= 50; j++) {
  //     let d = sceneSDF([i, j])
  //     if (d > 0) {
  //       context.fillStyle = 'rgba(95, 199, 106, ' + d / 6 + ')'
  //       rectangle([i, j], [0.5, 0.5])
  //     } else {
  //       context.fillStyle = 'rgba(237, 65, 65, ' + d / -6 + ')'
  //       rectangle([i, j], [0.5, 0.5])
  //     }
  //   }
  // }

  context.fillStyle = 'rgb(32, 194, 254)'
  circle(state.player, playerSize)

  context.fillStyle = 'rgba(32, 194, 254, 0.6)'
  for (let i = 0; i < state.particles.length; i++) {
    circle(state.particles[i], playerSize * (1 - i / state.particles.length / 2))
  }

  context.restore()
}

function lengthSquared(vector) {
  return vector[0] * vector[0] + vector[1] * vector[1]
}

function length(vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
}

function sceneSDF(pos) {
  let distance = Infinity
  for (let levelPart of levels[state.level].walls) {
    if (levelPart.length == 3) {
      let d = [pos[0] - levelPart[0], pos[1] - levelPart[1]]
      distance = Math.min(distance, length(d) - levelPart[2])
    } else if (levelPart.length == 4 || levelPart.length == 5) {
      let d = [
        pos[0] - levelPart[0],
        pos[1] - levelPart[1]
      ]
      if (levelPart[4]) {
        d = [
          d[0] * Math.cos(-levelPart[4]) - d[1] * Math.sin(-levelPart[4]),
          d[0] * Math.sin(-levelPart[4]) + d[1] * Math.cos(-levelPart[4]),
        ]
      }
      d = [
        Math.abs(d[0]) - levelPart[2],
        Math.abs(d[1]) - levelPart[3]
      ]
      if (Math.max(d[0], d[1]) > 0) {
        distance = Math.min(distance, length([Math.max(d[0], 0), Math.max(d[1], 0)]))
      } else {
        distance = Math.min(distance, Math.max(d[0], d[1]))
      }
    }
  }
  {
    let d = [pos[0] - state.umbra[0], pos[1] - state.umbra[1]]
    distance = Math.min(distance, (length(d) - umbraSize - 0.4))
  }
  return distance
}

function sceneNearestSurfacePoint(pos) {
  let p = pos
  let d = sceneSDF(p)
  for(var i = 0; i < 40 && d > eps; i ++) {
    let normal = sceneNormal(p)
    p = [p[0] - d * normal[0] * 0.9, p[1] - d * normal[1] * 0.9]
    let newD = sceneSDF(p)
    if (newD > d && i > 10) {
      p[0] += 0.1 * (Math.random() - 0.5)
      p[1] += 0.1 * (Math.random() - 0.5)
    }
    d = newD
  }
  return p
}

function sceneNormal(pos) {
  let n = [
    sceneSDF([pos[0] + eps, pos[1]]) - sceneSDF([pos[0] - eps, pos[1]]),
    sceneSDF([pos[0], pos[1] + eps]) - sceneSDF([pos[0], pos[1] - eps])
  ]
  let l = Math.sqrt(n[0] * n[0] + n[1] * n[1])
  return l == 0 ? [0, 0] : [n[0] / l, n[1] / l]
}

function collideBody(body, bodySize=eps, restitution=0.3) {
  let distance = sceneSDF(body)
  if (distance < bodySize) {
    let contact = sceneNearestSurfacePoint(body)
    let normal = [body[0] - contact[0], body[1] - contact[1]]
    let contactDistance = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1])
    if (contactDistance == 0) {
      normal = sceneNormal(body)
    } else {
      normal = [normal[0] / contactDistance, normal[1] / contactDistance]
    }
    let penetration = bodySize - contactDistance
    if (penetration > 0) {
      let dot = body[2] * normal[0] + body[3] * normal[1]
      // if (dot < -1) {
      //   bodySize -= Math.log(-dot)
      // }
      body[0] = body[0] + (1 + restitution) * normal[0] * penetration
      body[1] = body[1] + (1 + restitution) * normal[1] * penetration
      body[2] = body[2] - (1 + restitution) * dot * normal[0]
      body[3] = body[3] - (1 + restitution) * dot * normal[1]
      return true
    }
  }
  return false
}

function update(delta) {
  state.player[0] += state.player[2]
  state.player[1] += state.player[3]
  state.player[2] += acceleration * delta * (input.right - input.left)
  // state.player[3] += acceleration * delta * (input.down - input.up)
  state.player[3] += gravity * delta
  state.player[2] *= Math.pow(delta, decay)
  state.player[3] *= Math.pow(delta, decay)
  state.umbra[0] = input.mouseX
  state.umbra[1] = input.mouseY

  if(collideBody(state.player, playerSize)) {
    state.player[2] *= Math.pow(delta, friction)
    state.player[3] *= Math.pow(delta, friction)

  };
  for (var i = 0; i < state.enemies.length; i++) {
    if (length([state.umbra[0] - state.enemies[i][0], state.umbra[1] - state.enemies[i][1]]) > umbraSize - enemySize) {
      state.enemies[i][0] += state.enemies[i][2]
      state.enemies[i][1] += state.enemies[i][3]
      let d = [state.player[0] - state.enemies[i][0], state.player[1] - state.enemies[i][1]]
      let l = length(d)
      if (l < playerSize + enemySize) {
        resetPlayer()
      }
      collideBody(state.enemies[i], enemySize, 0.0)
      collideBody(state.enemies[i], enemySize, 0.0)
      state.enemies[i][2] += d[0] / l * enemyAcceleration * delta
      state.enemies[i][3] += d[1] / l * enemyAcceleration * delta
    }
  }

  let followFactor = Math.pow(delta, follow)
  state.particles[-1] = state.player
  for (let i = 0; i < state.particles.length; i++) {
    state.particles[i][0] += (state.particles[i - 1][0] - state.particles[i][0]) * followFactor
    state.particles[i][1] += (state.particles[i - 1][1] - state.particles[i][1]) * followFactor
  }

  if (Math.abs(levels[state.level].goal[0] - state.player[0]) + Math.abs(levels[state.level].goal[1] - state.player[1]) < 1.5
      && Math.abs(state.player[2]) + Math.abs(state.player[3]) < 5) {
    nextLevel()
  }

  if (state.player[1] > 70) {
    resetPlayer()
  }
}

let lastTime = performance.now()
let physicsLeftover = 0
let physicsTarget = 1 / 60
let physicsTime = 0

function run(time) {
  physicsLeftover += (time - lastTime) / 1000
  for (; physicsLeftover > 0; physicsLeftover -= physicsTarget) {
    update(physicsTarget)
  }
  draw()
  lastTime = time
  requestAnimationFrame(run)
}

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  draw()
}

function keydown(event) {
  input[mappings[event.keyCode]] = 1
}

function keyup(event) {
  input[mappings[event.keyCode]] = 0
}

function mousemove(event) {
  let minSide = Math.min(canvas.width, canvas.height)
  input.mouseX = (event.clientX - canvas.width / 2) * 100 / minSide
  input.mouseY = (event.clientY - canvas.height / 2) * 100 / minSide
}

nextLevel()
resize()
window.onresize = resize
window.onkeydown = keydown
window.onkeyup = keyup
window.onmousemove = mousemove
run(lastTime)
