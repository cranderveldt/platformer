import * as jQuery from 'jquery'
window.jQuery = jQuery
window.$ = jQuery
import _ from 'underscore'
window._ = _
import * as angular from 'angular'
window.angular = angular

import Player from './javascripts/models/player'
import Platform from './javascripts/models/platform'
import Token from './javascripts/models/token'

import sassyStyles from './sass/styles.scss'
import playerIcon from './images/player.gif'
import markup from './index.html'

var app = angular.module('platformer', []);
app.controller('Main', [
  '$scope',
  '$interval',
  function ($scope, $interval) {
    const vm = this;

    vm.environment = {
      // pixels per frame squared
      gravity: .75
      , friction: .5
      , air_resistance: .1
      , limits: {
        y: 450
        , x: 800
      }
      , time: {
        elapsed: 0
        , remaining: 10000
      }
      , game_over: false
      , watcher: null
      , level: 1
      , score: 0
      , best_score: 0
      , dev: false
      , title: true
    };

    vm.event_timestamps = {
      keyup: {
        right: 0
        , left: 0
        , up: 0
        , down: 0
      }
      , keydown: {
        right: 0
        , left: 0
        , up: 0
        , down: 0
      }
    }

    vm.keysdown = {
      right: false
      , left: false
      , up: false
      , down: false
    };

    vm.hasCollided = function(player, platform) {
      return (
        (player.right >= platform.left && player.left <= platform.right)
        && 
        (player.top >= platform.bottom && player.bottom <= platform.top)
      );
      // || (
      //   (platform.right >= player.left && platform.left <= player.right)
      //   && 
      //   (platform.top >= player.bottom && platform.bottom <= player.top)
      // );
    };

    vm.collsionFromAbove = function(player, platform) {
      return player.bottom + (vm.player.vel.y * -1) >= platform.top;
    };

    vm.collsionFromBelow = function(player, platform) {
      return player.top - vm.player.vel.y <= platform.bottom;
    };

    vm.collsionFromLeft = function(player, platform) {
      return player.right - vm.player.vel.x <= platform.left;
    };

    vm.collsionFromRight = function(player, platform) {
      return player.left + vm.player.vel.x >= platform.right;
    };

    vm.clipJump = function() {
      if (vm.player.vel.y > 4) {
        vm.player.setVelY(4);
      }
    };

    vm.clipMomentum = function() {
      if (vm.player.vel.x > 4) {
        vm.player.setVelX(4);
      }
    };

    vm.setPlatformCollisionsFalse = function() {
      for (var p in vm.platforms) {
        vm.platforms[p].has_collision = false;
      }
    };

    vm.playerKeyup = function(e) {
      if (e.keyCode === 37) {
        vm.keysdown.left = false;
        vm.event_timestamps.keyup.left = e.timeStamp;
        vm.clipMomentum();
      }
      if (e.keyCode === 39) {
        vm.keysdown.right = false;
        vm.event_timestamps.keyup.right = e.timeStamp;
        vm.clipMomentum();
      }
      if (e.keyCode === 32 || e.keyCode === 38) {
        vm.keysdown.up = false;
        vm.event_timestamps.keyup.up = e.timeStamp;
        vm.clipJump();
      }
      if (e.keyCode === 40) {
        vm.keysdown.down = false;
        vm.event_timestamps.keyup.down = e.timeStamp;
      }
    };

    vm.playerKeydown = function(e) {
      if (e.keyCode === 37) {
        vm.keysdown.left = true;
        vm.event_timestamps.keydown.left = e.timeStamp;
      }

      if (e.keyCode === 39) {
        vm.keysdown.right = true;
        vm.event_timestamps.keydown.right = e.timeStamp;
      }

      if (e.keyCode === 32 || e.keyCode === 38) {
        vm.keysdown.up = true;
        vm.event_timestamps.keydown.up = e.timeStamp;
      }

      if (e.keyCode === 40) {
        vm.keysdown.down = true;
        vm.event_timestamps.keydown.down = e.timeStamp;
      }

      if (e.keyCode === 82) {
        vm.resetGame();
      }

    };

    vm.checkInputs = function() {
      if (vm.keysdown.left) {
        var modifier = vm.player.dir <= 0 ? 1 : -1;
        var acc = vm.player.isOnGround() ? vm.player.constants.acc.ground : vm.player.constants.acc.air;
        vm.player.adjustVelX(acc * modifier);
        
        if (modifier > 0) {
          vm.player.dir = -1;
        }

        if (vm.player.vel.x < 0) {
          vm.player.dir = vm.player.dir * -1;
          vm.player.setVelX(Math.abs(vm.player.vel.x));
        }
      }

      if (vm.keysdown.right) {
        var modifier = vm.player.dir >= 0 ? 1 : -1;
        var acc = vm.player.isOnGround() ? vm.player.constants.acc.ground : vm.player.constants.acc.air;
        vm.player.adjustVelX(acc * modifier);

        if (modifier > 0) {
          vm.player.dir = 1;
        }

        if (vm.player.vel.x < 0) {
          vm.player.dir = vm.player.dir * -1;
          vm.player.setVelX(Math.abs(vm.player.vel.x));
        }
      }

      if (vm.keysdown.up) {

        // if on ground, record jump time
        // if no jump keyup, keep adding to the speed until you get to max height

        if (vm.player.isOnGround()) {
          vm.player.setVelY(15);
          vm.player.timestamps.jump = vm.event_timestamps.keydown.up;
          vm.player.jump_frames.current = 0;
        }
        // continuous jump
        // if (vm.player.isInAir() && vm.player.timestamps.jump > vm.event_timestamps.keyup.up && vm.player.jump_frames.current < vm.player.jump_frames.max) {
        //   vm.player.setVelY(12);
        //   vm.player.jump_frames.current = vm.player.jump_frames.current + 1;
        // }
        if (vm.player.timestamps.jump < vm.event_timestamps.keyup.up && vm.player.isInAir() && vm.player.canAirJump()) {
          vm.player.setVelY(15);
          vm.player.air_jump = true;
        }
      }
      if (vm.keysdown.down) {
        if (vm.player.isInAir()) {
          vm.player.setVelY(-25);
        }
      }
    };

    vm.executeSpeed = function() {
      // Check if the player has speed, move the position
      if (vm.player.vel.y !== 0) {
        vm.player.adjustPosY(vm.player.vel.y)
        
        // Setting the ground flag here when we move position
        if (vm.player.pos.y > 0) {
          vm.player.ground = false;
        } else {
          vm.player.ground = true;
          vm.player.air_jump = false;
        }
      }

      if (vm.player.vel.x > 0) {
        vm.player.adjustPosX(vm.player.vel.x * vm.player.dir);
      }
    };

    vm.executeAcceleration = function() {
      if (!vm.keysdown.right && !vm.keysdown.left && vm.player.vel.x > 0) {
        // Air resistance & friction
        if (vm.player.isOnGround()) {
          vm.player.adjustVelX(vm.environment.friction * -1);
        } else {
          vm.player.adjustVelX(vm.environment.air_resistance * -1);
        }
      }

      // If the player isn't on the ground, apply gravity effects
      if (vm.player.isInAir()) {
        vm.player.adjustVelY(vm.environment.gravity * -1);
      }

    };

    vm.checkPlatformCollision = function() {
      var player = vm.player.getCollisionObject();
      var has_no_collisions = true;
      for (var p in vm.platforms) {
        var platform = vm.platforms[p].getCollisionObject();
        if (vm.hasCollided(player, platform)) {
          has_no_collisions = false;

          // Look at this for detecting corner collisions better
          if (vm.player.hasNoYCollision()) {
            if (vm.collsionFromAbove(player, platform)) {
              vm.platforms[p].has_collision = true;
              vm.player.stopYMovement(platform.top);
              vm.player.ground = true;
              vm.player.air_jump = false;
              vm.player.col.y = true;
              
              if (!vm.platforms[p].stomped) {
                vm.platforms[p].stomped = true;
                vm.environment.score = vm.environment.score + 5;
              }
            }
            if (vm.collsionFromBelow(player, platform)) {
              vm.player.stopYMovement(platform.bottom - vm.player.size.y);
              vm.player.col.y = true;
            }
          }

          if (vm.collsionFromLeft(player, platform) && !vm.platforms[p].has_collision) {
            vm.player.stopXMovement(platform.left - vm.player.size.x);
          }
          if (vm.collsionFromRight(player, platform) && !vm.platforms[p].has_collision) {
            vm.player.stopXMovement(platform.right);
          }
        }
      }

      if (has_no_collisions) {
        if (vm.player.col.y) {
          vm.player.col.y = false;
          vm.setPlatformCollisionsFalse();
          if (vm.player.vel.y === 0) {
            vm.player.ground = false;
          }
        }
      }
    };

    vm.checkTokenCollision = function() {
      var player = vm.player.getCollisionObject();
      for (var t in vm.tokens) {
        var token = vm.tokens[t].getCollisionObject();
        if (vm.hasCollided(player, token)) {
          // remove token
          // apply effects of type
          vm.tokens.splice(t, 1);
          vm.environment.time.remaining = vm.environment.time.remaining - 5000;
          vm.environment.score = vm.environment.score - 10;
        }
      }
    };

    vm.enforceLimits = function() {
      // If player is on the ground, kill y speed
      if (vm.player.pos.y <= 0) {
        vm.player.stopYMovement(0);
      }

      // If player bonks the roof, kill y speed
      if (vm.player.pos.y >= vm.environment.limits.y - vm.player.size.y) {
        vm.player.stopYMovement(vm.environment.limits.y - vm.player.size.y);
      }

      // If player hits a wall, kill x speed
      if (vm.player.pos.x + vm.player.size.x >= vm.environment.limits.x && vm.player.dir > 0) {
        vm.player.stopXMovement(vm.environment.limits.x - vm.player.size.x);
      }

      if (vm.player.pos.x <= 0 && vm.player.dir < 0) {
        vm.player.stopXMovement(0);
      }
    };

    vm.checkWinConditions = function() {
      var any_unstomped = false;
      for (var p in vm.platforms) {
        if (!vm.platforms[p].stomped) {
          any_unstomped = true;
        }
      }

      if (!any_unstomped) {
        vm.addToRemainingTime();
        vm.resetLevel();
        vm.environment.level = vm.environment.level + 1;
        vm.environment.score = vm.environment.score + 10;
      }
    };

    vm.resetEnvironment = function() {
      vm.environment.time = {
        elapsed: 0
        , remaining: 15000
      };

      vm.environment.game_over = false;
      vm.environment.watcher = 0;
      vm.environment.level = 0;
      vm.environment.score = 0;
    };

    vm.resetLevel = function() {
      vm.player.reset();
      vm.resetPlatforms();
      vm.resetTokens();
    };

    vm.resetGame = function() {
      if (!_.isNull(vm.environment.watcher)) {
        vm.gameOver();
      }
      vm.resetLevel();
      vm.resetEnvironment();
      vm.gameWatcher();
    };

    vm.platformHasConflicts = function(platform) {
      var has_conflicts = false;
      var buffer = 50;
      platform.top = platform.top + vm.player.size.y + buffer;
      platform.bottom = platform.bottom - (vm.player.size.y + buffer);

      // Check for conflicts with start area
      if (vm.hasCollided(vm.player, platform)) {
        has_conflicts = true;
      }

      // Check for conflicts other platforms
      for (var p in vm.platforms) {
        if (vm.hasCollided(platform, vm.platforms[p].getCollisionObject())) {
          has_conflicts = true;
        }
      }
      return has_conflicts;
    };

    vm.getRandomPlatformX = function() {
      return _.random(30, 700)
    };

    vm.getRandomPlatformY = function(x, width, range) {
      range = range || [20, 400]
      var y = _.random(range[0], range[1]);

      if (vm.platformHasConflicts({top: y + 5, right: x + width, bottom: y, left: x})) {
        y = vm.getRandomPlatformY(x, width);
      }

      return y;
    };

    vm.generateRandomPlatform = function(range) {
      var x = _.random(700);
      var width = _.random(50, 120);
      var y = vm.getRandomPlatformY(x, width, range);
      return new Platform({ x: x, y: y }, { x: width, y: 5 });
    };

    vm.resetPlatforms = function() {
      vm.platforms = [];
      var platforms_count = Math.floor(vm.environment.level / 3) + 5;
      
      // First platform much be reachable from ground
      var platform = vm.generateRandomPlatform([100, 200]);
      vm.platforms.push(platform);

      // The rest of the platforms can be wherever
      do {
        platform = vm.generateRandomPlatform();
        vm.platforms.push(platform);
      } while (vm.platforms.length < platforms_count);
    };

    vm.resetTokens = function() {
      vm.tokens = [];
      
      var tokens_count = Math.floor(vm.environment.level / 5) + _.random(0, Math.floor(vm.environment.level / 5));
      
      // Don't spawn tokens on player, so we hardcode no x coord below 40
      do {
        var token = new Token({ x: _.random(80, 700), y: _.random(400) });
        vm.tokens.push(token);
      } while (vm.tokens.length < tokens_count);
    };

    vm.gameOver = function() {
      $interval.cancel(vm.environment.watcher);
      vm.environment.watcher = null;
      vm.environment.game_over = true;
      vm.environment.best_score = Math.max(vm.environment.score, vm.environment.best_score);
      localStorage.setItem('crander_platformer', '{"best_score": ' + vm.environment.best_score + '}');
    };

    vm.padNumber = function(num) {
      if (num < 10) {
        return "0" + num;
      }
      return num;
    };

    vm.advanceTime = function() {
      vm.environment.time.elapsed = vm.environment.time.elapsed + 20;
      vm.environment.time.remaining = vm.environment.time.remaining - 20;

      if (vm.environment.time.remaining <= 0 && !vm.environment.dev) {
        vm.gameOver();
      }
    };

    vm.addToRemainingTime = function() {
      vm.environment.time.remaining = vm.environment.time.remaining + 7000 + (Math.floor(vm.environment.level / 10) * 1000);
    };

    vm.timeRemaining = function() {
      return vm.padNumber(Math.floor(vm.environment.time.remaining / 1000)) + ":" + Math.floor((vm.environment.time.remaining % 1000) / 100);
    };

    vm.gameWatcher = function() {
      vm.environment.watcher = $interval(function() {
        vm.checkInputs();
        vm.executeSpeed();
        vm.checkPlatformCollision();
        vm.checkTokenCollision();
        vm.enforceLimits();
        vm.executeAcceleration();
        vm.advanceTime();
        vm.checkWinConditions();
      }, 20);
    };

    vm.startGame = function() {
      vm.gameWatcher();
      vm.environment.title = false;
    };

    vm.onPageLoad = function() {
      vm.player = new Player();
      vm.resetPlatforms();
      vm.resetTokens();

      var stored_object = localStorage.getItem('crander_platformer');
      if (!_.isNull(stored_object)) {
        stored_object = JSON.parse(stored_object);
        vm.environment.best_score = stored_object.best_score
      }
    };

    vm.onPageLoad();
  }
]);
