var app = angular.module('platformer', []);
app.controller('Main',['$scope', '$interval', function ($scope, $interval) {
  
  var Player = function() {
    var self = this;
    self.pos = { x: 0, y: 0 };
    self.vel = { x: 0, y: 0 };
    self.size = { x: 32, y: 32 };
    self.col = { x: false, y: false };
    self.dir = 0;
    self.ground = true;
    self.air_jump = false;
    self.timestamps = {
      jump: 0
      , air_jump: 0
    };
    self.constants = {
      acc: {
        air: 1
        , ground: 1
      }
      , max_x: 10
      , max_y: 15
    };
    self.jump_frames = {
      current: 0
      , max: 20
    };
    self.getCSSPosition = function() {
      return { bottom: self.pos.y, left: self.pos.x };
    };
    self.getCollisionObject = function() {
      return { top: self.pos.y + self.size.y, right: self.pos.x + self.size.x, bottom: self.pos.y, left: self.pos.x };
    };
    self.isOnGround = function() {
      return self.ground;
    };
    self.isInAir = function() {
      return !self.ground;
    };
    self.hasUsedAirJump = function() {
      return self.air_jump;
    };
    self.canAirJump = function() {
      return !self.air_jump;
    };
    self.hasNoYCollision = function() {
      return !self.col.y;
    };
    self.hasNoXCollision = function() {
      return !self.col.x;
    };
    
    // set with constraints
    self.setVelX = function(x) {
      self.vel.x = Math.min(x, self.constants.max_x);
    };
    self.setVelY = function(y) {
      self.vel.y = Math.min(y, self.constants.max_y);
    };
    self.adjustVelX = function(x) {
      self.vel.x = Math.min(self.vel.x + x, self.constants.max_x);
    };
    self.adjustVelY = function(y) {
      self.vel.y = Math.min(self.vel.y + y, self.constants.max_y);
    };

    self.setPosX = function(x) {
      self.pos.x = x;
    };
    self.setPosY = function(y) {
      self.pos.y = y;
    };
    self.adjustPosX = function(x) {
      self.pos.x = self.pos.x + x;
    };
    self.adjustPosY = function(y) {
      self.pos.y = self.pos.y + y;
    };

    self.stopYMovement = function(pos) {
      self.setVelY(0);
      self.setPosY(pos);
    };
    self.stopXMovement = function(pos) {
      self.setVelX(0);
      self.setPosX(pos);
      self.dir = 0;
    };
    self.reset = function() {
      self.pos = { x: 0, y: 0 };
      self.vel = { x: 0, y: 0 };
      self.col = { x: false, y: false };
      self.dir = 0;
      self.ground = true;
      self.air_jump = false;
      self.timestamps = {
        jump: 0
        , air_jump: 0
      };
      
      self.jump_frames.current = 0;
    };
  };

  var Platform = function(pos, size) {
    self = this;
    self.pos = pos || { x: 300, y: 100 };
    self.size = size || { x: 80, y: 5 };
    self.stomped = false;
  };
  Platform.prototype.getCSSProperties = function() {
    return { bottom: this.pos.y, left: this.pos.x, width: this.size.x, height: this.size.y, backgroundColor: this.stomped ? 'blue' : 'black' };
  };
  Platform.prototype.getCollisionObject = function() {
    return { top: this.pos.y + this.size.y, right: this.pos.x + this.size.x, bottom: this.pos.y, left: this.pos.x };
  };


  $scope.environment = {
    // pixels per frame squared
    gravity: .75
    , friction: .33
    , air_resistance: .25
    , limits: {
      y: 450
      , x: 800
    }
    , time: {
      elapsed: 0
      , remaining: 15000
    }
    , game_over: false
    , watcher: 0
    , level: 0
  };

  $scope.event_timestamps = {
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

  $scope.keysdown = {
    right: false
    , left: false
    , up: false
    , down: false
  };

  $scope.hasCollided = function(player, platform) {
    return (
      (player.right >= platform.left && player.left <= platform.right)
    ) && (
      (player.top >= platform.bottom && player.bottom <= platform.top)
    );
  };

  $scope.collsionFromAbove = function(player, platform) {
    return player.bottom + ($scope.player.vel.y * -1) >= platform.top;
  };

  $scope.collsionFromBelow = function(player, platform) {
    return player.top - $scope.player.vel.y <= platform.bottom;
  };

  $scope.collsionFromLeft = function(player, platform) {
    return player.right - $scope.player.vel.x <= platform.left;
  };

  $scope.collsionFromRight = function(player, platform) {
    return player.left + $scope.player.vel.x >= platform.right;
  };

  $scope.clipJump = function() {
    if ($scope.player.vel.y > 4) {
      $scope.player.setVelY(4);
    }
  };

  $scope.playerKeyup = function(e) {
    if (e.keyCode === 37) {
      $scope.keysdown.left = false;
      $scope.event_timestamps.keyup.left = e.timeStamp;
    }
    if (e.keyCode === 39) {
      $scope.keysdown.right = false;
      $scope.event_timestamps.keyup.right = e.timeStamp;
    }
    if (e.keyCode === 32 || e.keyCode === 38) {
      $scope.keysdown.up = false;
      $scope.event_timestamps.keyup.up = e.timeStamp;
      $scope.clipJump();
    }
    if (e.keyCode === 40) {
      $scope.keysdown.down = false;
      $scope.event_timestamps.keyup.down = e.timeStamp;
    }
  };

  $scope.playerKeydown = function(e) {
    // console.log(e);
    if (e.keyCode === 37) {
      $scope.keysdown.left = true;
      $scope.event_timestamps.keydown.left = e.timeStamp;
    }

    if (e.keyCode === 39) {
      $scope.keysdown.right = true;
      $scope.event_timestamps.keydown.right = e.timeStamp;
    }

    if (e.keyCode === 32 || e.keyCode === 38) {
      $scope.keysdown.up = true;
      $scope.event_timestamps.keydown.up = e.timeStamp;
    }

    if (e.keyCode === 40) {
      $scope.keysdown.down = true;
      $scope.event_timestamps.keydown.down = e.timeStamp;
    }

  };

  $scope.checkInputs = function() {
    if ($scope.keysdown.left) {
      var modifier = $scope.player.dir <= 0 ? 1 : -1;
      var acc = $scope.player.isOnGround() ? $scope.player.constants.acc.ground : $scope.player.constants.acc.air;
      $scope.player.adjustVelX(acc * modifier);
      
      if (modifier > 0) {
        $scope.player.dir = -1;
      }

      if ($scope.player.vel.x < 0) {
        $scope.player.dir = $scope.player.dir * -1;
        $scope.player.setVelX(Math.abs($scope.player.vel.x));
      }
    }

    if ($scope.keysdown.right) {
      var modifier = $scope.player.dir >= 0 ? 1 : -1;
      var acc = $scope.player.isOnGround() ? $scope.player.constants.acc.ground : $scope.player.constants.acc.air;
      $scope.player.adjustVelX(acc * modifier);

      if (modifier > 0) {
        $scope.player.dir = 1;
      }

      if ($scope.player.vel.x < 0) {
        $scope.player.dir = $scope.player.dir * -1;
        $scope.player.setVelX(Math.abs($scope.player.vel.x));
      }
    }

    if ($scope.keysdown.up) {

      // if on ground, record jump time
      // if no jump keyup, keep adding to the speed until you get to max height

      if ($scope.player.isOnGround()) {
        $scope.player.setVelY(15);
        $scope.player.timestamps.jump = $scope.event_timestamps.keydown.up;
        $scope.player.jump_frames.current = 0;
      }
      // continuous jump
      // if ($scope.player.isInAir() && $scope.player.timestamps.jump > $scope.event_timestamps.keyup.up && $scope.player.jump_frames.current < $scope.player.jump_frames.max) {
      //   $scope.player.setVelY(12);
      //   $scope.player.jump_frames.current = $scope.player.jump_frames.current + 1;
      // }
      if ($scope.player.timestamps.jump < $scope.event_timestamps.keyup.up && $scope.player.isInAir() && $scope.player.canAirJump()) {
        $scope.player.setVelY(15);
        $scope.player.air_jump = true;
      }
    }
    if ($scope.keysdown.down) {
      if ($scope.player.isInAir()) {
        $scope.player.setVelY(-25);
      }
    }
  };

  $scope.executeSpeed = function() {
    // Check if the player has speed, move the position
    if ($scope.player.vel.y !== 0) {
      $scope.player.adjustPosY($scope.player.vel.y)
      
      // Setting the ground flag here when we move position
      if ($scope.player.pos.y > 0) {
        $scope.player.ground = false;
      } else {
        $scope.player.ground = true;
        $scope.player.air_jump = false;
      }
    }

    if ($scope.player.vel.x > 0) {
      $scope.player.adjustPosX($scope.player.vel.x * $scope.player.dir);
    }
  };

  $scope.executeAcceleration = function() {
    if (!$scope.keysdown.right && !$scope.keysdown.left && $scope.player.vel.x > 0) {
      // Air resistance & friction
      if ($scope.player.isOnGround()) {
        $scope.player.adjustVelX($scope.environment.friction * -1);
      } else {
        $scope.player.adjustVelX($scope.environment.air_resistance * -1);
      }
    }

    // If the player isn't on the ground, apply gravity effects
    if ($scope.player.isInAir()) {
      $scope.player.adjustVelY($scope.environment.gravity * -1);
    }

  };

  $scope.checkCollision = function() {
    var player = $scope.player.getCollisionObject();
    var has_no_collisions = true;
    for (var p in $scope.platforms) {
      var platform = $scope.platforms[p].getCollisionObject();
      if ($scope.hasCollided(player, platform)) {

        has_no_collisions = false;
        if ($scope.player.hasNoYCollision()) {
          if ($scope.collsionFromAbove(player, platform)) {
            $scope.player.stopYMovement(platform.top);
            $scope.player.ground = true;
            $scope.player.air_jump = false;
            $scope.player.col.y = true;
            $scope.platforms[p].stomped = true;
          }
          if ($scope.collsionFromBelow(player, platform)) {
            $scope.player.stopYMovement(platform.bottom - $scope.player.size.y);
            $scope.player.col.y = true;
          }
        }
        if ($scope.player.hasNoXCollision()) {
          if ($scope.collsionFromLeft(player, platform)) {
            $scope.player.stopXMovement(platform.left - $scope.player.size.x);
            $scope.player.col.x = true;
          }
          if ($scope.collsionFromRight(player, platform)) {
            $scope.player.stopXMovement(platform.right);
            $scope.player.col.x = true;
          }
        }
      }
    }

    if (has_no_collisions) {
      if ($scope.player.col.y) {
        $scope.player.col.y = false;
        if ($scope.player.vel.y === 0) {
          $scope.player.ground = false;
        }
      }
      if ($scope.player.col.x) {
        $scope.player.col.x = false;
      }
    }
  };

  $scope.enforceLimits = function() {
    // If player is on the ground, kill y speed
    if ($scope.player.pos.y <= 0) {
      $scope.player.stopYMovement(0);
    }

    // If player bonks the roof, kill y speed
    if ($scope.player.pos.y >= $scope.environment.limits.y - $scope.player.size.y) {
      $scope.player.stopYMovement($scope.environment.limits.y - $scope.player.size.y);
    }

    // If player hits a wall, kill x speed
    if ($scope.player.pos.x + $scope.player.size.x >= $scope.environment.limits.x && $scope.player.dir > 0) {
      $scope.player.stopXMovement($scope.environment.limits.x - $scope.player.size.x);
    }

    if ($scope.player.pos.x <= 0 && $scope.player.dir < 0) {
      $scope.player.stopXMovement(0);
    }
  };

  $scope.checkWinConditions = function() {
    var any_unstomped = false;
    for (var p in $scope.platforms) {
      if (!$scope.platforms[p].stomped) {
        any_unstomped = true;
      }
    }

    if (!any_unstomped) {
      $scope.addToRemainingTime();
      $scope.resetLevel();
      $scope.environment.level = $scope.environment.level + 1;
    }
  };

  $scope.resetLevel = function() {
    $scope.player.reset();
    $scope.resetPlatforms();
  };

  $scope.resetPlatforms = function() {
    $scope.platforms = [];
    do {
      $scope.platforms.push(new Platform({ x: _.random(700), y: _.random(400) }, { x: 80, y: 5 }));
    } while ($scope.platforms.length < 5);
  };

  $scope.gameOver = function() {
    $interval.cancel($scope.environment.watcher);
    $scope.environment.game_over = true;
  };

  $scope.padNumber = function(num) {
    if (num < 10) {
      return "00" + num;
    }
    if (num < 100) {
      return "0" + num;
    }
    return num;
  };

  $scope.advanceTime = function() {
    $scope.environment.time.elapsed = $scope.environment.time.elapsed + 20;
    $scope.environment.time.remaining = $scope.environment.time.remaining - 20;

    if ($scope.environment.time.remaining <= 0) {
      $scope.gameOver();
    }
  };

  $scope.addToRemainingTime = function() {
    $scope.environment.time.remaining = $scope.environment.time.remaining + 10000;
  };

  $scope.timeRemaining = function() {
    return $scope.padNumber(Math.floor($scope.environment.time.remaining / 1000)) + ":" + $scope.padNumber($scope.environment.time.remaining % 1000);
  };

  $scope.gameWatcher = function() {
    $scope.environment.watcher = $interval(function() {
      $scope.checkInputs();
      $scope.executeSpeed();
      $scope.checkCollision();
      $scope.enforceLimits();
      $scope.executeAcceleration();
      $scope.advanceTime();
      $scope.checkWinConditions();
    }, 20);
  };

  $scope.onPageLoad = function() {
    $scope.player = new Player();
    $scope.resetPlatforms();
    $scope.gameWatcher();
  };

  $scope.onPageLoad();

}]);

app.directive('cdrPlayer', function () {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, element, attrs) {
      
    }
  };
});