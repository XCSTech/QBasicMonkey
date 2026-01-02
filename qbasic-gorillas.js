/**
 * QBasic Gorillas Web Component
 * A self-contained web component of the classic QBasic Gorillas game
 *
 * Usage:
 *   <script src="qbasic-gorillas.js"></script>
 *   <qbasic-gorillas></qbasic-gorillas>
 */
(function() {
  'use strict';

  // ============================================
  // Shape Helper Class
  // ============================================
  class Shape {
    constructor(context, canvas) {
      this.context = context;
      this.canvas = canvas;
    }

    circle(x, y, width) {
      this.context.beginPath();
      this.context.arc(x, y, width, 0, Math.PI * 2, true);
      this.context.closePath();
      this.context.fill();
    }

    rectangle(x, y, w, h) {
      this.context.fillRect(x, y, w, h);
    }

    ellipse(x, y, w, h) {
      const kappa = 0.5522848;
      const ox = (w / 2) * kappa;
      const oy = (h / 2) * kappa;
      const xe = x + w;
      const ye = y + h;
      const xm = x + w / 2;
      const ym = y + h / 2;

      this.context.beginPath();
      this.context.moveTo(x, ym);
      this.context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      this.context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      this.context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      this.context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
      this.context.closePath();
      this.context.fill();
    }
  }

  // ============================================
  // Banana Class
  // ============================================
  class Banana {
    constructor(context, initx, inity, force, angle, wind, gameSettings) {
      this.context = context;
      this.initx = initx;
      this.inity = inity;
      this.force = force;
      this.angle = angle;
      this.projectionX = 0;
      this.projectionY = 0;
      this.scale = gameSettings.bananaSpeed;
      this.gravity = gameSettings.gravity;
      this.calcInitialPosition();
      this.startTime = 0;
      this.wind = wind;
      this.direction = 'up';
      this.timer = 0;
    }

    x() {
      return this.initx + this.projectionX;
    }

    y() {
      return this.inity - this.projectionY;
    }

    create(player) {
      this.context.fillStyle = 'rgb(255, 255, 0)';
      this.context.strokeStyle = 'rgb(255, 255, 0)';
      const direction = this.direction;
      switch (direction) {
        case 'up':
          this.rotateBanana([1.6 * Math.PI, 0.4 * Math.PI, false], (player === 2) ? 'right' : 'left');
          break;
        case 'right':
          this.rotateBanana([1.1 * Math.PI, 1.9 * Math.PI, false], (player === 2) ? 'down' : 'up');
          break;
        case 'down':
          this.rotateBanana([0.6 * Math.PI, 1.4 * Math.PI, false], (player === 2) ? 'left' : 'right');
          break;
        case 'left':
          this.rotateBanana([0.1 * Math.PI, 0.9 * Math.PI, false], (player === 2) ? 'up' : 'down');
          break;
      }
    }

    rotateBanana(arc, direction) {
      for (let i = -5; i < -1; i++) {
        this.context.beginPath();
        this.context.arc(this.x() + 1 + i, this.y(), 3, arc[0], arc[1], arc[2]);
        this.context.stroke();
      }
      if (!(this.timer < 5)) {
        this.direction = direction;
        this.timer = 0;
      } else {
        this.timer++;
      }
    }

    createFrame(time, player) {
      this.startTime = time;
      this.create(player);
      this.calcProjection();
    }

    calcInitialPosition() {
      const radian = this.angle * Math.PI / 180;
      this.dx = this.force * Math.cos(radian) + this.wind;
      this.dy = this.force * Math.sin(radian) - this.gravity * this.startTime;
    }

    calcProjection() {
      this.calcInitialPosition();
      this.projectionX += this.dx * this.scale;
      this.projectionY += this.dy * this.scale;
    }
  }

  // ============================================
  // Gorilla Class
  // ============================================
  class Gorilla {
    static BODY_COLOR = 'rgb(255, 170, 82)';
    static BODY_LINE = 'rgb(0, 0, 160)';

    constructor(context, playerNumber, gameSettings, canvas) {
      this.context = context;
      this.playerNumber = playerNumber;
      this.gameSettings = gameSettings;
      this.canvas = canvas;
      this.width = 40;
      this.height = 40;
      this.wins = 0;
      this.dead = false;
      this.animate = false;
      this.directionRight = 'down';
      this.directionLeft = 'up';
      this.animations = 0;
      this.explosionWidth = this.width;
      this.explosionHeight = this.height;
      this.oldY = false;
      this.timer = 0;
      this.justThrown = false;
    }

    create(x, y) {
      if (this.dead) {
        this.renderDead();
        return;
      }

      this.x = x;

      if (!this.oldY) {
        this.oldY = true;
        this.y = y - 47;
      } else {
        this.y = y;
      }

      // Draw the Head
      this.context.fillStyle = Gorilla.BODY_COLOR;
      this.context.fillRect(this.x - 4, this.y, 7, 7);
      this.context.fillRect(this.x - 5, this.y + 2, 9, 3);

      // Draw the eyes/brow
      this.context.fillStyle = Gorilla.BODY_LINE;
      this.context.fillRect(this.x - 3, this.y + 2, 5, 1);
      this.context.fillRect(this.x - 3, this.y + 4, 2, 1);
      this.context.fillRect(this.x, this.y + 4, 2, 1);

      // Draw the Neck
      this.context.fillStyle = Gorilla.BODY_COLOR;
      this.context.fillRect(this.x - 3, this.y + 7, 5, 1);

      // Draw the Body
      this.context.fillRect(this.x - 9, this.y + 8, 17, 7);
      this.context.fillRect(this.x - 7, this.y + 15, 13, 6);

      // Draw the Legs
      for (let i = 0; i < 4; i++) {
        this.context.strokeStyle = Gorilla.BODY_COLOR;
        this.context.beginPath();
        this.context.arc(this.x + 2 + i, this.y + 25, 10, 3 * Math.PI / 4, 9 * Math.PI / 8, false);
        this.context.stroke();
        this.context.beginPath();
        this.context.arc(this.x - 3 - i, this.y + 25, 10, 15 * Math.PI / 8, Math.PI / 4, false);
        this.context.stroke();
      }

      // Draw the Chest
      this.context.strokeStyle = Gorilla.BODY_LINE;
      this.context.beginPath();
      this.context.arc(this.x - 5, this.y + 10, 4.9, 0, 3 * Math.PI / 5, false);
      this.context.stroke();
      this.context.beginPath();
      this.context.arc(this.x + 4, this.y + 10, 4.9, 3 * Math.PI / 7, 4 * Math.PI / 4, false);
      this.context.stroke();

      if (this.animate) {
        if (this.directionLeft === 'up') {
          this.animateArms('leftArm', [15, 3 * Math.PI / 4, 5 * Math.PI / 4, false], (this.directionLeft === 'down') ? 'up' : 'down');
        } else {
          this.animateArms('leftArm', [5, 3 * Math.PI / 4, 5 * Math.PI / 4, false], (this.directionLeft === 'up') ? 'down' : 'up');
        }
        if (this.directionRight === 'up') {
          this.animateArms('rightArm', [15, 7 * Math.PI / 4, Math.PI / 4, false], (this.directionRight === 'down') ? 'up' : 'down');
        } else {
          this.animateArms('rightArm', [5, 7 * Math.PI / 4, Math.PI / 4, false], (this.directionRight === 'up') ? 'down' : 'up');
        }
      } else {
        for (let i = -5; i < -1; i++) {
          this.context.strokeStyle = Gorilla.BODY_COLOR;
          this.context.beginPath();
          this.context.arc(this.x + 1 + i, this.y + 15, 9, 3 * Math.PI / 4, 5 * Math.PI / 4, false);
          this.context.stroke();
          this.context.beginPath();
          this.context.arc(this.x - 2 - i, this.y + 15, 9, 7 * Math.PI / 4, Math.PI / 4, false);
          this.context.stroke();
        }
      }
    }

    animateArms(arm, arc, direction) {
      this.context.strokeStyle = Gorilla.BODY_COLOR;
      for (let i = -5; i < -1; i++) {
        if (arm === 'leftArm') {
          this.context.beginPath();
          this.context.arc(this.x + 1 + i, this.y + arc[0], 9, arc[1], arc[2], arc[3]);
          this.context.stroke();
        }
        if (arm === 'rightArm') {
          this.context.beginPath();
          this.context.arc(this.x - 2 - i, this.y + arc[0], 9, arc[1], arc[2], arc[3]);
          this.context.stroke();
        }
      }
      if (arm === 'leftArm') this.directionLeft = direction;
      if (arm === 'rightArm') this.directionRight = direction;
    }

    reCreate() {
      this.create(this.x, this.y);
    }

    getBanana(force, angle, wind) {
      this.banana = new Banana(this.context, this.x, this.y - 17, force, angle, wind, this.gameSettings);
    }

    renderDead() {
      this.context.fillStyle = 'rgb(0, 0, 160)';
      const shape = new Shape(this.context, this.canvas);
      shape.ellipse(this.x - this.width * 2, this.y, 2.5 * this.explosionWidth, this.explosionHeight);
    }

    animateColission() {
      const explosionIncrement = this.gameSettings.explosionSize;
      this.context.fillStyle = 'rgb(245, 11, 11)';
      this.explosionWidth += explosionIncrement;
      this.explosionHeight += explosionIncrement;
      const shape = new Shape(this.context, this.canvas);
      shape.ellipse(this.x - this.width * 2, this.y, 2.5 * this.explosionWidth, this.explosionHeight);
    }

    throwBanana(time) {
      if (this.timer < 1) {
        this.animate = true;
        if (this.playerNumber === 1) {
          this.directionRight = 'up';
          this.directionLeft = 'down';
        } else {
          this.directionRight = 'down';
          this.directionLeft = 'up';
        }
        this.timer++;
      } else {
        this.animate = false;
      }
      this.banana.createFrame(time, this.playerNumber);
    }

    checkColission(x, y) {
      if (this.y <= y && x > this.x - this.width / 2 && x < this.x + this.width / 2) {
        this.dead = true;
        return true;
      }
      return false;
    }

    animateWin() {
      this.animations++;
    }
  }

  // ============================================
  // Building Class
  // ============================================
  class Building {
    constructor(context, canvasHeight, gameSettings, canvas) {
      this.context = context;
      this.canvas = canvas;
      this.gameSettings = gameSettings;
      this.width = 37 + Math.floor(Math.random() * 70);
      this.baseHeight = 80;
      this.baseLine = 335;
      this.spacing = 1;
      this.windowHeight = 7;
      this.windowWidth = 4;
      this.buildingColors = ['rgb(173, 170, 173)', 'rgb(0, 170, 173)', 'rgb(173, 0, 0)'];
      this.buildingColor = null;
      this.windows = [];
      this.colissions = [];
    }

    positionAtX() {
      return this.x;
    }

    positionAtY() {
      return this.canvas.height - this.height;
    }

    endPosition() {
      return this.positionAtX() + this.width + this.spacing;
    }

    middlePosition() {
      return this.positionAtX() + (this.endPosition() - this.positionAtX()) / 2;
    }

    create(x, y) {
      this.x = x;
      this.y = y;
      this.buildingColor = this.buildingColor || this.buildingColors[Math.floor(Math.random() * 3)];
      this.context.fillStyle = this.buildingColor;
      this.height = this.baseHeight + y;
      this.context.fillRect(this.positionAtX(), this.baseLine - this.height, this.width, this.height);
      this.createWindows(this.positionAtX(), this.positionAtY());
    }

    reCreate() {
      this.create(this.x, this.y);
    }

    createWindows(x, y) {
      if (this.windows.length > 0) {
        for (let i = 0; i < this.windows.length; i++) {
          const w = this.windows[i];
          this.createWindow(w[0], w[1], w[2]);
        }
        return;
      }
      for (let row = 3; row < Math.floor(this.width - 11 + this.windowWidth); row += 11) {
        for (let column = 3; column < Math.floor(this.height - 15); column += 15) {
          const color = (Math.floor(Math.random() * 5) > 0) ? 'rgb(255, 255, 82)' : 'rgb(82, 85, 82)';
          this.createWindow(x + 1 + row, Math.floor((this.baseLine - this.height) + 1 + column), color);
          this.windows.push([x + 1 + row, Math.floor((this.baseLine - this.height) + 1 + column), color]);
        }
      }
    }

    createWindow(x, y, color) {
      this.context.fillStyle = color;
      this.context.fillRect(x, y, this.windowWidth, this.windowHeight);
    }

    checkColission(x, y) {
      if (this.positionAtY() - 25 <= y && (x > this.x && x < this.x + this.width + 10)) {
        this.colissions.push([x - 20, y]);
        this.createColission(x - 20, y);
        return true;
      }
      return false;
    }

    createColission(x, y) {
      const explosionSize = this.gameSettings.explosionSize;
      const width = explosionSize;
      const height = explosionSize * 0.6;
      this.context.fillStyle = 'rgb(0, 0, 160)';
      const shape = new Shape(this.context, this.canvas);
      shape.ellipse(x, y, width, height);
    }

    reCreateColissions() {
      if (this.colissions.length > 0) {
        for (let i = 0; i < this.colissions.length; i++) {
          const colission = this.colissions[i];
          this.createColission(colission[0], colission[1]);
        }
      }
    }
  }

  // ============================================
  // Sun Class
  // ============================================
  class Sun {
    static SUN_BODY_COLOR = 'rgb(255, 255, 0)';
    static SUN_EYES_COLOR = 'rgb(0, 0, 160)';

    constructor(context, canvas) {
      this.context = context;
      this.canvas = canvas;
      this.mouth = false;
      this.width = 10;
      this.height = 27;
      this.position = (this.canvas.width / 2);
    }

    create(hit) {
      if (hit) this.mouth = true;
      this.createRays();
      this.createBody();
      this.createEyes();
      this.createMouth();
    }

    createBody() {
      const shape = new Shape(this.context, this.canvas);
      this.context.fillStyle = Sun.SUN_BODY_COLOR;
      shape.circle(this.position, this.height, this.width);
    }

    createEyes() {
      const shape = new Shape(this.context, this.canvas);
      this.context.fillStyle = Sun.SUN_EYES_COLOR;
      shape.circle(this.position - 2.5, this.height - 2.5, 1);
      shape.circle(this.position + 2.5, this.height - 2.5, 1);
    }

    createRays() {
      const createRay = (a) => {
        this.context.moveTo(this.position, this.height);
        this.context.lineTo(this.position + 20 * Math.cos(a), this.height + 20 * Math.sin(a));
      };
      this.context.strokeStyle = Sun.SUN_BODY_COLOR;
      this.context.beginPath();
      this.context.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        createRay(360 * i / 4.5);
      }
      this.context.stroke();
    }

    createMouth() {
      this.context.fillStyle = Sun.SUN_BODY_COLOR;
      this.context.strokeStyle = Sun.SUN_EYES_COLOR;
      if (this.mouth) {
        this.context.fillStyle = Sun.SUN_EYES_COLOR;
        const shape = new Shape(this.context, this.canvas);
        shape.circle(this.position, this.height + 5, this.width / 4);
      } else {
        this.context.beginPath();
        this.context.arc(this.position, this.height + 1, this.width / 2, 0.25, 2.9, false);
        this.context.stroke();
      }
    }
  }

  // ============================================
  // Wind Class
  // ============================================
  class Wind {
    constructor(context, canvas) {
      this.context = context;
      this.canvas = canvas;
      this.windSpeed = Math.floor(Math.random() * 10 - 5);
      if (Math.floor(Math.random() * 3) === 1) {
        if (this.windSpeed > 0) {
          this.windSpeed += Math.floor(Math.random() * 10);
        } else {
          this.windSpeed -= Math.floor(Math.random() * 10);
        }
      }
    }

    create() {
      if (this.windSpeed !== 0) {
        this.windLine = this.windSpeed * 3 * (this.canvas.width / 320);
        this.context.strokeStyle = 'rgb(245, 11, 11)';
        this.context.beginPath();
        this.context.moveTo(this.canvas.width / 2, this.canvas.height - 5);
        this.context.lineTo(this.canvas.width / 2 + this.windLine, this.canvas.height - 5);
        if (this.windSpeed > 0) {
          this.arrowDir = -2;
        } else {
          this.arrowDir = 2;
        }
        this.context.moveTo(this.canvas.width / 2 + this.windLine, this.canvas.height - 5);
        this.context.lineTo(this.canvas.width / 2 + this.windLine + this.arrowDir, this.canvas.height - 5 - 2);
        this.context.moveTo(this.canvas.width / 2 + this.windLine, this.canvas.height - 5);
        this.context.lineTo(this.canvas.width / 2 + this.windLine + this.arrowDir, this.canvas.height - 5 + 2);
        this.context.stroke();
      }
    }
  }

  // ============================================
  // App (Game) Class
  // ============================================
  class App {
    constructor(canvas, gameSettings, component) {
      this.component = component;
      this.gameSettings = gameSettings;
      this.empty = true;
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.context = this.canvas.getContext('2d');
      this.sunShock = false;
      this.winner = [];
      this.scores = {
        player_1: 0,
        player_2: 0
      };
      this.buildings = [];
      this.frameRate = 15;
      this.wind = new Wind(this.context, this.canvas);
    }

    createScene() {
      this.clear();
      this.createSun();
      if (this.empty) {
        this.empty = false;
        this.createBuildings();
        this.createGorillas();
        this.wind = new Wind(this.context, this.canvas);
      } else {
        this.reCreateBuildings();
        this.reCreateColissions();
        this.reCreateGorillas();
      }
      this.wind.create();
      this.updateScore();
    }

    createBuildings() {
      let position = 0;
      while (position < this.width) {
        const building = this.createBuilding(position);
        position = building.endPosition();
      }
    }

    createBuilding(x) {
      const building = new Building(this.context, this.height, this.gameSettings, this.canvas);
      const y = Math.floor(Math.random() * 150);
      building.create(x, y);
      this.buildings.push(building);
      return building;
    }

    reCreateBuildings() {
      for (let i = 0; i < this.buildings.length; i++) {
        this.buildings[i].reCreate();
      }
    }

    reCreateColissions() {
      for (let i = 0; i < this.buildings.length; i++) {
        this.buildings[i].reCreateColissions();
      }
    }

    createSun() {
      const sun = new Sun(this.context, this.canvas);
      if (this.sunShock) {
        sun.create(true);
      } else {
        sun.create();
      }
    }

    clear() {
      return this.canvas.width = this.canvas.width;
    }

    clearTimeouts() {
      clearTimeout(this.timeout);
    }

    createGorillas() {
      let buildingOnePosition, buildingTwoPosition, building;

      buildingOnePosition = Math.floor(Math.random() * this.buildings.length / 2);
      building = this.buildings[buildingOnePosition];
      this.player_1 = new Gorilla(this.context, 1, this.gameSettings, this.canvas);
      this.player_1.create(building.middlePosition(), building.positionAtY());

      buildingTwoPosition = Math.floor(Math.random() * (this.buildings.length - 2 - buildingOnePosition)) + buildingOnePosition + 1;
      building = this.buildings[buildingTwoPosition];
      this.player_2 = new Gorilla(this.context, 2, this.gameSettings, this.canvas);
      this.player_2.create(building.middlePosition(), building.positionAtY());
    }

    reCreateGorillas() {
      this.player_1.reCreate();
      this.player_2.reCreate();
    }

    throwBanana(force, angle, player) {
      const that = this;
      if (player === 2) {
        angle = -angle;
        force = -force;
      }
      const playerObj = this['player_' + player];
      playerObj.getBanana(force, angle, this.wind.windSpeed);
      this.timeout = setTimeout(function() {
        that.startTime = new Date();
        that.animateBanana(playerObj, that.startTime);
      }, this.frameRate);
    }

    updateScore() {
      this.context.fillStyle = 'rgb(0, 0, 160)';
      this.context.font = 'bold 14px courier';
      this.context.fillRect(this.width / 2 - 45, this.height - 40, 90, 13);
      this.context.fillStyle = 'rgb(255, 255, 255)';
      this.context.fillText(this.scores.player_1 + '>Score<' + this.scores.player_2, this.width / 2 - 37, this.height - 30);
    }

    animateBanana(player) {
      const that = this;
      this.timeout = setTimeout(function() {
        that.createScene();
        if (that.bananaHitSun(player)) that.sunShock = true;
        if (that.bananaHitGorilla(player)) return;
        if (that.bananaHasHit(player)) {
          that.nextPlayerTurn(player);
          return;
        }
        if (that.withinBoundries(player.banana.x(), player.banana.y()) === false) {
          that.nextPlayerTurn(player);
          return;
        }
        const now = new Date();
        const time = now - that.startTime;

        player.throwBanana(time / 1000);
        that.animateBanana(player);
      }, this.frameRate);
    }

    bananaHitSun(player) {
      const x = player.banana.x();
      const y = player.banana.y();
      if (x <= (this.width / 2) + 10 && x >= (this.width / 2) - 10 && y <= 27 && y >= 17) {
        return true;
      }
      return false;
    }

    bananaHasHit(player) {
      const x = player.banana.x();
      const y = player.banana.y();
      for (let i = 0; i < this.buildings.length; i++) {
        if (this.buildings[i].checkColission(x, y)) return true;
      }
      return false;
    }

    bananaHitGorilla(player) {
      const that = this;
      const x = player.banana.x();
      const y = player.banana.y();
      if (this.player_2.checkColission(x, y) || this.player_1.checkColission(x, y)) {
        const deadPlayer = (this.player_2.dead === true) ? this.player_2 : this.player_1;
        const winner = (this.player_2.dead === false) ? this.player_2 : this.player_1;
        this.winner.push(winner.playerNumber);
        this.timeout = setTimeout(function() {
          that.animateColission(deadPlayer);
        }, 5);
        this.scores['player_' + winner.playerNumber]++;
        this.updateScore();
        this.timeout = setTimeout(function() {
          that.startTime = new Date();
          winner.animate = true;
          that.createScene();
          player.animateWin();
          that.animateWin(winner, that.startTime);
        }, this.frameRate);
        return true;
      }
    }

    animateColission(player) {
      const that = this;
      this.timeout = setTimeout(function() {
        that.startTime = new Date();
        player.animateColission();
      }, 0);
    }

    animateWin(player, startTime) {
      const that = this;
      this.startTime = startTime;
      this.timeout = setTimeout(function() {
        while (!(player.animate === true && player.animations < 12)) {
          that.empty = true;
          that.buildings = [];
          that.createScene();
          that.nextPlayerTurn(player);
          return;
        }
        that.createScene();
        player.animateWin();
        that.animateWin(player, that.startTime);
      }, 800);
    }

    nextPlayerTurn(player) {
      this.sunShock = false;
      player.timer = 0;
      const nextPlayer = (player.playerNumber === 2) ? 1 : 2;
      this.component.showPlayerField('player_' + nextPlayer, 'angle');
    }

    withinBoundries(x, y) {
      return (x < 0 || x > this.width || y > this.height) ? false : true;
    }
  }

  // ============================================
  // Web Component Definition
  // ============================================
  class QBasicGorillas extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this.gameSettings = {
        gravity: 9.8,
        explosionSize: 50,
        bananaSpeed: 0.1
      };
    }

    connectedCallback() {
      this.render();
      this.initGame();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: courier;
            font-size: 14px;
            font-weight: bold;
          }

          .wrapper {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 20px;
            width: fit-content;
            padding: 20px;
          }

          .game-window {
            display: flex;
            flex-direction: column;
            background: #c0c0c0;
            border: 2px solid #fff;
            border-right-color: #808080;
            border-bottom-color: #808080;
            box-shadow: 1px 1px 0 #000;
          }

          .game-titlebar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(90deg, #000080, #1084d0);
            color: #fff;
            padding: 2px 4px;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
          }

          .game-title {
            flex: 1;
          }

          .game-buttons {
            display: flex;
            gap: 2px;
          }

          .game-btn {
            background: #c0c0c0;
            color: #000;
            width: 16px;
            height: 14px;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #fff;
            border-right-color: #808080;
            border-bottom-color: #808080;
          }

          .game-menubar {
            display: flex;
            gap: 0;
            background: #c0c0c0;
            padding: 2px 4px;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 11px;
            border-bottom: 1px solid #808080;
          }

          .game-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .container {
            width: 650px;
            height: 360px;
            position: relative;
          }

          .players {
            position: absolute;
            padding: 10px;
            width: 630px;
            color: #fff;
          }

          .player-1 {
            text-align: left;
            float: left;
            width: 300px;
          }

          .player-2 {
            text-align: right;
            float: right;
            width: 200px;
          }

          label {
            margin-right: 8px;
            clear: left;
            font-size: 12px;
            line-height: 32px;
            color: #fff;
          }

          input {
            background: #000080;
            width: 80px;
            border: 2px solid #fff;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            font-family: courier;
            padding: 4px 8px;
            margin-bottom: 6px;
          }

          input:focus {
            outline: none;
            border-color: #ffff00;
            box-shadow: 0 0 8px #ffff00;
          }

          canvas {
            background-color: #0000a0;
            margin: 0 auto;
          }

          .editor-window {
            display: flex;
            flex-direction: column;
            width: 320px;
            height: 360px;
            background: #c0c0c0;
            border: 2px solid #fff;
            border-right-color: #808080;
            border-bottom-color: #808080;
            box-shadow: 1px 1px 0 #000;
          }

          .editor-titlebar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(90deg, #000080, #1084d0);
            color: #fff;
            padding: 2px 4px;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
          }

          .editor-title {
            flex: 1;
          }

          .editor-buttons {
            display: flex;
            gap: 2px;
          }

          .editor-btn {
            background: #c0c0c0;
            color: #000;
            width: 16px;
            height: 14px;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #fff;
            border-right-color: #808080;
            border-bottom-color: #808080;
          }

          .editor-menubar {
            display: flex;
            gap: 0;
            background: #c0c0c0;
            padding: 2px 4px;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 11px;
            border-bottom: 1px solid #808080;
          }

          .menu-item {
            padding: 1px 8px;
            color: #000;
          }

          .menu-item:first-child {
            text-decoration: underline;
          }

          .editor-content {
            flex: 1;
            background: #0000aa;
            overflow: hidden;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .editor-content pre {
            margin: 0;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            white-space: pre;
            background: transparent;
          }

          .editor-content pre.qbasic-filler {
            color: #6666cc;
          }

          .editor-content pre.qbasic {
            color: #ffffff;
          }

          .editor-content .comment {
            color: #55ff55;
            font-style: italic;
          }

          .qbasic-input {
            background: #ffff00;
            border: none;
            color: #000080;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            padding: 0 2px;
            text-align: center;
          }

          .qbasic-input:focus {
            outline: 2px solid #fff;
            background: #ffff55;
          }

          .qbasic-input.gravity {
            width: 3.5ch;
          }

          .qbasic-input.explosion {
            width: 4ch;
          }

          .qbasic-input.speed {
            width: 2.5ch;
          }

          /* Mobile responsive layout */
          @media (max-width: 800px) {
            :host {
              width: 100%;
              max-width: 100vw;
              overflow-x: hidden;
            }

            .wrapper {
              flex-direction: column;
              align-items: center;
              width: 100%;
              max-width: 100vw;
              padding: 0;
              box-sizing: border-box;
              overflow-x: hidden;
            }

            .editor-window {
              order: 2;
              width: 100%;
              margin: 10px 0;
              box-sizing: border-box;
              height: auto;
              min-height: 250px;
              display: none;
            }

            .game-wrapper {
              order: 1;
              width: 100%;
              overflow: hidden;
            }

            .game-window {
              width: 100%;
            }

            .container {
              width: 100%;
              max-width: 100vw;
              height: auto;
              aspect-ratio: 650 / 360;
              margin: 0;
              box-sizing: border-box;
            }

            .container canvas {
              width: 100%;
              max-width: 100vw;
              height: auto;
              border-radius: 8px;
              box-sizing: border-box;
            }

            .players {
              width: 100%;
              font-size: 10px;
              display: flex;
              justify-content: space-between;
              padding: 5px;
              box-sizing: border-box;
            }

            .players .player-1,
            .players .player-2 {
              width: auto;
              float: none;
              text-align: left;
            }

            .players label {
              font-size: 10px;
              line-height: 20px;
              margin-right: 4px;
            }

            .players input {
              width: 40px;
              font-size: 10px;
              padding: 2px 4px;
              margin-bottom: 3px;
            }

            .autoplay-btn {
              font-size: 11px;
              padding: 3px 12px;
            }
          }

          .autoplay-btn {
            background: #c0c0c0;
            color: #000;
            border: none;
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            border-right: 2px solid #808080;
            border-bottom: 2px solid #808080;
            box-shadow: 1px 1px 0 #000, inset 1px 1px 0 #dfdfdf;
            padding: 4px 16px;
            font-family: "MS Sans Serif", Arial, sans-serif;
            font-size: 12px;
            cursor: pointer;
            margin-top: 10px;
          }

          .autoplay-btn:hover {
            background: #d4d4d4;
          }

          .autoplay-btn:active {
            border-top: 2px solid #808080;
            border-left: 2px solid #808080;
            border-right: 2px solid #fff;
            border-bottom: 2px solid #fff;
            box-shadow: none;
            padding: 5px 15px 3px 17px;
          }

          .autoplay-btn:disabled {
            color: #808080;
            text-shadow: 1px 1px 0 #fff;
            cursor: not-allowed;
          }
        </style>

        <div class="wrapper">
          <div class="editor-window">
            <div class="editor-titlebar">
              <span class="editor-title">GORILLA.BAS</span>
              <div class="editor-buttons">
                <span class="editor-btn">_</span>
                <span class="editor-btn">X</span>
              </div>
            </div>
            <div class="editor-menubar">
              <span class="menu-item">File</span>
              <span class="menu-item">Edit</span>
              <span class="menu-item">View</span>
              <span class="menu-item">Search</span>
              <span class="menu-item">Run</span>
            </div>
            <div class="editor-content">
              <pre class="qbasic-filler">'Q B a s i c  G o r i l l a s
DIM SHARED gravity#</pre>
              <pre class="qbasic"><span class="comment">' GRAVITY - Pull on banana</span>
x# = StartXPos + (InitXVel# * t#)
y# = StartYPos + (.5 * <input type="text" class="qbasic-input gravity" value="9.8"> * t# ^ 2)<i><span style='color: red;'><-Edit Me</span></i>
</pre>
              <pre class="qbasic-filler">IF (x# >= ScrWidth) THEN
  OnScreen = FALSE
END IF</pre>
              <pre class="qbasic"><span class="comment">' EXPLOSION - Radius size</span>
SUB DoExplosion (x#, y#)
  Radius = ScrHeight / <input type="text" class="qbasic-input explosion" value="50"><i><span style='color: red;'><-Edit Me</span></i></pre>
              <pre class="qbasic-filler">  FOR c# = 0 TO Radius
    CIRCLE (x#, y#), c#
  NEXT c#
END SUB</pre>
              <pre class="qbasic"><span class="comment">' SPEED - Banana velocity</span>
DO WHILE NOT Impact
  t# = t# + <input type="text" class="qbasic-input speed" value=".1"><i><span style='color: red;'><-Edit Me</span></i>
LOOP</pre>
              <pre class="qbasic-filler">END SUB
FUNCTION Scl (n!)
  Scl = CINT(n! / 2)
END FUNCTION</pre>
            </div>
          </div>
          <div class="game-wrapper">
            <div class="game-window">
              <div class="game-titlebar">
                <span class="game-title">GORILLA.BAS - QBasic</span>
                <div class="game-buttons">
                  <span class="game-btn">_</span>
                  <span class="game-btn">X</span>
                </div>
              </div>
              <div class="game-menubar">
                <span class="menu-item">File</span>
                <span class="menu-item">Edit</span>
                <span class="menu-item">View</span>
                <span class="menu-item">Search</span>
                <span class="menu-item">Run</span>
                <span class="menu-item">Debug</span>
                <span class="menu-item">Options</span>
                <span class="menu-item">Help</span>
              </div>
              <div class="container">
                <div class="players">
                  <div class="player-1">
                    Player 1
                    <br/>
                    <label style="float: left;">Angle:</label>
                    <input class="player-angle" data-player="1" maxlength="3">
                    <br/>
                    <label style="float: left;">Velocity:</label>
                    <input class="player-velocity" data-player="1" maxlength="3">
                  </div>
                  <div class="player-2">
                    Player 2
                    <br/>
                    <label style="float: left;">Angle:</label>
                    <input class="player-angle" data-player="2" maxlength="3">
                    <br/>
                    <label style="float: left;">Velocity:</label>
                    <input class="player-velocity" data-player="2" maxlength="3">
                  </div>
                </div>
                <canvas width="640" height="350"></canvas>
              </div>
            </div>
            <button class="autoplay-btn">Let Me Play</button>
          </div>
        </div>
      `;
    }

    initGame() {
      const canvas = this.shadowRoot.querySelector('canvas');
      this.app = new App(canvas, this.gameSettings, this);

      // Get player input elements
      const p1angle = this.shadowRoot.querySelector('.player-1 .player-angle');
      const p1velocity = this.shadowRoot.querySelector('.player-1 .player-velocity');
      const p2angle = this.shadowRoot.querySelector('.player-2 .player-angle');
      const p2velocity = this.shadowRoot.querySelector('.player-2 .player-velocity');

      // Store references
      this.playerInputs = {
        player_1: { angle: p1angle, velocity: p1velocity },
        player_2: { angle: p2angle, velocity: p2velocity }
      };

      // Event listeners for player 1
      p1angle.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          this.app.clearTimeouts();
          this.showPlayerField('player_1', 'velocity');
        }
      });

      p1velocity.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          this.hidePlayerField('player_1', 'angle');
          this.hidePlayerField('player_1', 'velocity');
          const params = this.readAngleAndVelocity('player_1');
          this.clearFields('player_1');
          this.app.throwBanana(parseInt(params.velocity), parseInt(params.angle), 1);
        }
      });

      // Event listeners for player 2
      p2angle.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          this.app.clearTimeouts();
          this.showPlayerField('player_2', 'velocity');
        }
      });

      p2velocity.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          this.hidePlayerField('player_2', 'angle');
          this.hidePlayerField('player_2', 'velocity');
          const params = this.readAngleAndVelocity('player_2');
          this.clearFields('player_2');
          this.app.throwBanana(parseInt(params.velocity), parseInt(params.angle), 2);
        }
      });

      // Initial state
      p1angle.style.display = 'block';
      p1angle.previousElementSibling.style.display = 'block';
      p1angle.focus();

      p2angle.style.display = 'none';
      p2angle.previousElementSibling.style.display = 'none';
      p2velocity.style.display = 'none';
      p2velocity.previousElementSibling.style.display = 'none';

      // Settings inputs
      const gravityInput = this.shadowRoot.querySelector('.qbasic-input.gravity');
      const explosionInput = this.shadowRoot.querySelector('.qbasic-input.explosion');
      const speedInput = this.shadowRoot.querySelector('.qbasic-input.speed');

      gravityInput.addEventListener('input', () => {
        const val = parseFloat(gravityInput.value);
        if (!isNaN(val)) this.gameSettings.gravity = val;
      });

      explosionInput.addEventListener('input', () => {
        const val = parseInt(explosionInput.value);
        if (!isNaN(val) && val > 0) this.gameSettings.explosionSize = val;
      });

      speedInput.addEventListener('input', () => {
        const val = parseFloat(speedInput.value);
        if (!isNaN(val)) this.gameSettings.bananaSpeed = val;
      });

      // Autoplay button
      const autoplayBtn = this.shadowRoot.querySelector('.autoplay-btn');
      this.autoplayActive = false;

      autoplayBtn.addEventListener('click', () => {
        if (this.autoplayActive) {
          this.stopAutoplay();
          autoplayBtn.textContent = 'Enable Autoplay';
        } else {
          this.startAutoplay();
          autoplayBtn.textContent = 'Let Me Play';
        }
      });

      // Start the game
      this.app.createScene();

      // Start autoplay by default
      this.startAutoplay();
    }

    startAutoplay() {
      this.autoplayActive = true;
      this.runAutoplayTurn();
    }

    stopAutoplay() {
      this.autoplayActive = false;
      if (this.autoplayTimeout) {
        clearTimeout(this.autoplayTimeout);
        this.autoplayTimeout = null;
      }
    }

    runAutoplayTurn() {
      if (!this.autoplayActive) return;

      // Find which player's turn it is
      const p1AngleVisible = this.playerInputs.player_1.angle.style.display !== 'none';
      const p2AngleVisible = this.playerInputs.player_2.angle.style.display !== 'none';

      let currentPlayer;
      if (p1AngleVisible) {
        currentPlayer = 'player_1';
      } else if (p2AngleVisible) {
        currentPlayer = 'player_2';
      } else {
        // Wait and check again
        this.autoplayTimeout = setTimeout(() => this.runAutoplayTurn(), 500);
        return;
      }

      const angleInput = this.playerInputs[currentPlayer].angle;
      const velocityInput = this.playerInputs[currentPlayer].velocity;

      // Random angle 10-70, velocity 10-35
      const angle = Math.floor(Math.random() * 61) + 10;
      const velocity = Math.floor(Math.random() * 26) + 10;

      // Step 1: Type angle (after 1 second)
      this.autoplayTimeout = setTimeout(() => {
        if (!this.autoplayActive) return;
        angleInput.value = angle;

        // Step 2: Press enter on angle (after 1 second)
        this.autoplayTimeout = setTimeout(() => {
          if (!this.autoplayActive) return;
          angleInput.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

          // Step 3: Type velocity (after 1 second)
          this.autoplayTimeout = setTimeout(() => {
            if (!this.autoplayActive) return;
            velocityInput.value = velocity;

            // Step 4: Press enter on velocity (after 1 second)
            this.autoplayTimeout = setTimeout(() => {
              if (!this.autoplayActive) return;
              velocityInput.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

              // Schedule next turn
              this.autoplayTimeout = setTimeout(() => this.runAutoplayTurn(), 2000);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }

    hidePlayerField(player, field) {
      const el = this.playerInputs[player][field];
      el.style.display = 'none';
      el.previousElementSibling.style.display = 'none';
    }

    showPlayerField(player, field) {
      const el = this.playerInputs[player][field];
      el.style.display = 'block';
      el.previousElementSibling.style.display = 'block';
      el.focus();
    }

    readAngleAndVelocity(player) {
      return {
        angle: this.playerInputs[player].angle.value,
        velocity: this.playerInputs[player].velocity.value
      };
    }

    clearFields(player) {
      this.playerInputs[player].angle.value = '';
      this.playerInputs[player].velocity.value = '';
    }
  }

  // Register the custom element
  customElements.define('qbasic-gorillas', QBasicGorillas);
})();
