import levels from './levels';

let canvas;
let context;
const playerSize = 2;
const acceleration = 240;
const decay = 0.001;
const friction = 0.004;
const gravity = 120;
const follow = 0.2;
const umbraSize = 10;
const umbraSpeed = 180;
const enemySize = 2;
const enemyAcceleration = 180;
const eps = 0.01;

const input = {
  left: 0,
  right: 0,
  up: 0,
  down: 0,
  mouseX: 0,
  mouseY: -50,
};
const mappings = {
  32: 'up',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'left',
  68: 'right',
};

const state = {
  level: -1,
  levelTime: 0,
  player: [0, 0, 0, 0],
  particles: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  enemies: [],
  umbra: [0, 0, 0, 0],
};

let gradients = [];

function regenerateGradients() {
  gradients = [];
  for (let i = 0; i < 7; i++) {
    const gradient = context.createLinearGradient(
      Math.random() * 100 - 50,
      Math.random() * 100 - 50,
      Math.random() * 100 - 50,
      Math.random() * 100 - 50,
    );
    gradient.addColorStop(0, `hsla(${Math.random() * 360}, 100%, 92%, 1.0)`);
    gradient.addColorStop(1, `hsla(${Math.random() * 360}, 100%, 92%, 0.0)`);
    gradients.push(gradient);
  }
}

function nextLevel() {
  state.level++;
  // eslint-disable-next-line no-use-before-define
  resetPlayer();
  state.particles = Array(50).fill().map(() => [state.player[0], state.player[1]]);
  state.enemies = (levels[state.level].enemies || []).map(enemy => [enemy[0], enemy[1], 0, 0]);
  regenerateGradients();
}

function resetPlayer() {
  state.player = [levels[state.level].start[0], levels[state.level].start[1], 0, 0];
}

function scene({
  nothing, circle, rectangle, triangle, combine, invert, bodyCircle, tag,
}) {
  const level = combine(...levels[state.level].walls.map((levelPart) => {
    if (levelPart.length === 3) {
      return circle([levelPart[0], levelPart[1]], levelPart[2]);
    } if (levelPart.length === 4 || levelPart.length === 5) {
      return rectangle([levelPart[0], levelPart[1]], [levelPart[2], levelPart[3]], levelPart[4]);
    }
    return nothing;
  }));
  const enemies = combine(...state.enemies.map((enemy, i) => tag(bodyCircle(`enemy${i}`, enemy, enemySize, triangle(enemy, [enemySize, enemySize], Math.atan2(state.player[1] - enemy[1], state.player[0] - enemy[0]))), 'enemy')));
  const umbra = circle(state.umbra, umbraSize);
  const goal = tag(rectangle(levels[state.level].goal, [2, 2]), 'goal');
  const player = tag(bodyCircle('player', state.player, playerSize), 'player');
  return combine(level, goal, invert(umbra), enemies, player);
}

function draw() {
  context.save();

  context.fillStyle = 'rgb(32, 12, 38)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const minSide = Math.min(canvas.width, canvas.height);
  context.setTransform(minSide / 100, 0, 0, minSide / 100, canvas.width / 2, canvas.height / 2);
  // context.translate(-state.player[0], -state.player[1])

  const tags = {
    wall: 'rgb(242, 242, 242)',
    goal: 'rgb(116, 210, 32)',
    player: 'rgb(32, 194, 254)',
    enemy: 'rgb(242, 35, 110)',
    _inverted: 'rgb(32, 12, 38)',
  };
  let tag = 'wall';

  function gradientJumble(func) {
    context.fillStyle = tags[tag];
    func.apply(this);
    if (tags[tag] === 'rgb(242, 242, 242)') {
      for (const gradient of gradients) {
        context.fillStyle = gradient;
        func.apply(this);
      }
    }
  }

  scene({
    nothing: () => {},
    circle: ([x, y], radius) => () => {
      gradientJumble(() => {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
    },
    bodyCircle: (id, [x, y], radius, displayOperation) => () => {
      if (displayOperation) {
        displayOperation();
      } else {
        gradientJumble(() => {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        });
      }
    },
    rectangle: ([x, y], [extentX, extentY], rotation = 0) => () => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      gradientJumble(() => context.fillRect(-extentX, -extentY, extentX * 2, extentY * 2));
      context.restore();
    },
    triangle: ([x, y], [sizeX, sizeY], rotation = 0) => () => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      gradientJumble(() => {
        context.beginPath();
        context.moveTo(sizeX, 0);
        context.lineTo(-sizeX, -sizeY);
        context.lineTo(-sizeX, sizeY);
        context.closePath();
        context.fill();
      });
      context.restore();
    },
    combine: (...operations) => () => {
      for (const operation of operations) {
        operation();
      }
    },
    invert: operation => () => {
      const originalTag = tag;
      tag = tag === '_inverted' ? 'wall' : '_inverted';
      operation();
      tag = originalTag;
    },
    tag: (operation, targetTag) => () => {
      const originalTag = tag;
      tag = targetTag;
      operation();
      tag = originalTag;
    },
  })();

  context.fillStyle = 'rgb(170, 170, 170)';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '40px sans';
  for (const text of levels[state.level].texts || []) {
    context.translate(text[0], text[1]);
    context.scale(100 / minSide, 100 / minSide);
    context.fillText(text[2], text[0], text[1]);
    context.scale(minSide / 100, minSide / 100);
    context.translate(-text[0], -text[1]);
  }

  context.fillStyle = 'rgba(32, 194, 254, 0.6)';
  for (let i = 0; i < state.particles.length; i++) {
    context.beginPath();
    context.arc(
      state.particles[i][0],
      state.particles[i][1],
      playerSize * (1 - i / state.particles.length / 2),
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  context.restore();
}

// function lengthSquared(vector) {
//   return vector[0] * vector[0] + vector[1] * vector[1]
// }

function length(vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

function generateSceneSDF() {
  return scene({
    nothing: () => {},
    circle: ([x, y, vx = 0, vy = 0], radius) => ([px, py]) => [length([px - x, py - y]) - radius, vx, vy, 'wall'],
    bodyCircle: (id, [x, y, vx = 0, vy = 0], radius) => ([px, py], ignoreId) => {
      if (id === ignoreId) {
        return [Infinity, vx, vy, 'body'];
      }
      return [length([px - x, py - y]) - radius, vx, vy, 'body'];
    },
    rectangle: ([x, y, vx = 0, vy = 0], [extentX, extentY], rotation = 0) => ([px, py]) => {
      let d = [px - x, py - y];
      if (rotation) {
        d = [
          d[0] * Math.cos(-rotation) - d[1] * Math.sin(-rotation),
          d[0] * Math.sin(-rotation) + d[1] * Math.cos(-rotation),
        ];
      }
      d = [Math.abs(d[0]) - extentX, Math.abs(d[1]) - extentY];
      if (Math.max(d[0], d[1]) > 0) {
        return [length([Math.max(d[0], 0), Math.max(d[1], 0)]), vx, vy, 'wall'];
      }
      return [Math.max(d[0], d[1]), vx, vy, 'wall'];
    },
    triangle: () => undefined,
    combine: (...operations) => (pos, ignoreId) => {
      let min;
      for (const operation of operations) {
        const result = operation(pos, ignoreId);
        if (result === undefined) {
          // pass
        } else if (result[3] === '_inverted') {
          if (min !== undefined && result[0] > min[0]) {
            min = result.slice(0, 3).concat([min[3]]);
          }
        } else if (min === undefined || result[0] < min[0]) {
          min = result;
        }
      }
      return min;
    },
    invert: operation => (pos, ignoreId) => {
      const result = operation(pos, ignoreId);
      return [-result[0]].concat(result.slice(1, 3), ['_inverted']);
    },
    tag: (operation, targetTag) => (pos, ignoreId) => {
      const result = operation(pos, ignoreId);
      return result.slice(0, 3).concat([targetTag]);
    },
  });
}

function sdfNormal(sdf, pos, ignoreId) {
  const n = [
    sdf([pos[0] + eps, pos[1]], ignoreId)[0] - sdf([pos[0] - eps, pos[1]], ignoreId)[0],
    sdf([pos[0], pos[1] + eps], ignoreId)[0] - sdf([pos[0], pos[1] - eps], ignoreId)[0],
  ];
  const l = Math.sqrt(n[0] * n[0] + n[1] * n[1]);
  return l === 0 ? [0, 0] : [n[0] / l, n[1] / l];
}

function sdfNearestSurfacePoint(sdf, pos, ignoreId) {
  let p = pos;
  let d = sdf(p, ignoreId)[0];
  for (let i = 0; i < 40 && d > eps; i++) {
    const normal = sdfNormal(sdf, p, ignoreId);
    p = [p[0] - d * normal[0] * 0.9, p[1] - d * normal[1] * 0.9];
    const newD = sdf(p, ignoreId)[0];
    if (newD > d && i > 10) {
      p[0] += 0.1 * (Math.random() - 0.5);
      p[1] += 0.1 * (Math.random() - 0.5);
    }
    d = newD;
  }
  return p;
}

function collideBody(sdf, bodyId, body, bodySize = eps, restitution = 0.3) {
  const distance = sdf(body, bodyId)[0];
  if (distance < bodySize) {
    const contact = sdfNearestSurfacePoint(sdf, body, bodyId);
    let normal = [body[0] - contact[0], body[1] - contact[1]];
    const contactDistance = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
    if (contactDistance === 0) {
      normal = sdfNormal(sdf, body, bodyId);
    } else {
      normal = [normal[0] / contactDistance, normal[1] / contactDistance];
    }
    const penetration = bodySize - contactDistance;
    if (penetration > 0) {
      const contactData = sdf(contact, bodyId);
      const dot = (body[2] - contactData[1]) * normal[0] + (body[3] - contactData[2]) * normal[1];
      const newBody = [
        body[0] + (1 + restitution) * normal[0] * penetration,
        body[1] + (1 + restitution) * normal[1] * penetration,
        body[2] - (1 + restitution) * dot * normal[0],
        body[3] - (1 + restitution) * dot * normal[1],
      ];
      return [newBody, contactData];
    }
  }
  return [body, undefined];
}

function update(delta) {
  state.player[0] += state.player[2] * delta;
  state.player[1] += state.player[3] * delta;
  state.player[2] += acceleration * delta * (input.right - input.left);
  // state.player[3] += acceleration * delta * (input.down - input.up)
  state.player[3] += gravity * delta;
  state.player[2] *= delta ** decay;
  state.player[3] *= delta ** decay;
  state.umbra[0] += state.umbra[2] * delta;
  state.umbra[1] += state.umbra[3] * delta;
  state.umbra[2] = (input.mouseX - state.umbra[0]) / delta;
  state.umbra[3] = (input.mouseY - state.umbra[1]) / delta;
  if (length([state.umbra[2], state.umbra[3]]) > umbraSpeed) {
    const l = length([state.umbra[2], state.umbra[3]]);
    state.umbra[2] = state.umbra[2] / l * umbraSpeed;
    state.umbra[3] = state.umbra[3] / l * umbraSpeed;
  }

  const sdf = generateSceneSDF();
  const [newPlayer, contact] = collideBody(sdf, 'player', state.player, playerSize);
  state.player = newPlayer;

  if (contact) {
    state.player[2] *= delta ** friction;
    state.player[3] *= delta ** friction;
    if (contact[3] === 'goal') {
      nextLevel();
      return;
    }
    if (contact[3] === 'enemy') {
      resetPlayer();
    }
  }
  if (Math.abs(state.player[1]) > 100) {
    resetPlayer();
  }

  for (let i = 0; i < state.enemies.length; i++) {
    state.enemies[i][0] += state.enemies[i][2] * delta;
    state.enemies[i][1] += state.enemies[i][3] * delta;
    [state.enemies[i]] = collideBody(sdf, `enemy${i}`, state.enemies[i], enemySize, 0.0);
    const d = [state.player[0] - state.enemies[i][0], state.player[1] - state.enemies[i][1]];
    const l = length(d);
    state.enemies[i][2] += d[0] / l * enemyAcceleration * delta;
    state.enemies[i][3] += d[1] / l * enemyAcceleration * delta;
    if (Math.abs(state.enemies[i][0]) > 100 || Math.abs(state.enemies[i][1]) > 100) {
      state.enemies[i] = [
        levels[state.level].enemies[i][0],
        levels[state.level].enemies[i][1],
        0,
        0,
      ];
    }
  }

  const followFactor = delta ** follow;
  state.particles[-1] = state.player;
  for (let i = 0; i < state.particles.length; i++) {
    state.particles[i][0] += (state.particles[i - 1][0] - state.particles[i][0]) * followFactor;
    state.particles[i][1] += (state.particles[i - 1][1] - state.particles[i][1]) * followFactor;
  }
}

let lastTime = performance.now();
let physicsLeftover = 0;
const physicsTarget = 1 / 60;

function run(time) {
  physicsLeftover += (time - lastTime) / 1000;
  for (; physicsLeftover > 0; physicsLeftover -= physicsTarget) {
    update(physicsTarget);
  }
  draw();
  lastTime = time;
  requestAnimationFrame(run);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

function keydown(event) {
  input[mappings[event.keyCode]] = 1;
}

function keyup(event) {
  input[mappings[event.keyCode]] = 0;
}

function mousemove(event) {
  const minSide = Math.min(canvas.width, canvas.height);
  input.mouseX = (event.clientX - canvas.width / 2) * 100 / minSide;
  input.mouseY = (event.clientY - canvas.height / 2) * 100 / minSide;
}

window.addEventListener('load', () => {
  canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.parentNode.style.margin = '0';
  document.body.parentNode.style.padding = '0';
  context = canvas.getContext('2d');
  nextLevel();
  resize();
  window.onresize = resize;
  window.onkeydown = keydown;
  window.onkeyup = keyup;
  window.onmousemove = mousemove;
  run(lastTime);
});
