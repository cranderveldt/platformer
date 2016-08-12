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
      && 
      (player.top >= platform.bottom && player.bottom <= platform.top)
    );
    // || (
    //   (platform.right >= player.left && platform.left <= player.right)
    //   && 
    //   (platform.top >= player.bottom && platform.bottom <= player.top)
    // );
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

  $scope.clipMomentum = function() {
    if ($scope.player.vel.x > 4) {
      $scope.player.setVelX(4);
    }
  };

  $scope.playerKeyup = function(e) {
    if (e.keyCode === 37) {
      $scope.keysdown.left = false;
      $scope.event_timestamps.keyup.left = e.timeStamp;
      $scope.clipMomentum();
    }
    if (e.keyCode === 39) {
      $scope.keysdown.right = false;
      $scope.event_timestamps.keyup.right = e.timeStamp;
      $scope.clipMomentum();
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
    // console.log(e.keyCode);
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

    if (e.keyCode === 82) {
      $scope.resetGame();
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
        // console.log('yep');
        has_no_collisions = false;

        // Look at this for detecting corner collisions better
        if ($scope.player.hasNoYCollision()) {
          if ($scope.collsionFromAbove(player, platform)) {
            $scope.player.stopYMovement(platform.top);
            $scope.player.ground = true;
            $scope.player.air_jump = false;
            $scope.player.col.y = true;
            
            if (!$scope.platforms[p].stomped) {
              $scope.platforms[p].stomped = true;
              $scope.environment.score = $scope.environment.score + 5;
            }
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
      $scope.environment.score = $scope.environment.score + 10;
    }
  };

  $scope.resetEnvironment = function() {
    $scope.environment.time = {
      elapsed: 0
      , remaining: 15000
    };

    $scope.environment.game_over = false;
    $scope.environment.watcher = 0;
    $scope.environment.level = 0;
    $scope.environment.score = 0;
  };

  $scope.resetLevel = function() {
    $scope.player.reset();
    $scope.resetPlatforms();
  };

  $scope.resetGame = function() {
    if (!_.isNull($scope.environment.watcher)) {
      $scope.gameOver();
    }
    $scope.resetLevel();
    $scope.resetEnvironment();
    $scope.gameWatcher();
  };

  $scope.platformHasConflicts = function(platform) {
    var has_conflicts = false;
    var buffer = 10;
    platform.top = platform.top + $scope.player.size.y + buffer;
    platform.bottom = platform.bottom - ($scope.player.size.y + buffer);

    for (var p in $scope.platforms) {
      if ($scope.hasCollided(platform, $scope.platforms[p].getCollisionObject())) {
        has_conflicts = true;
      }
    }
    return has_conflicts;
  };

  $scope.getRandomPlatformX = function() {
    return _.random(30, 700)
  };

  $scope.getRandomPlatformY = function(x, width, range) {
    range = range || [20, 400]
    var y = _.random(range[0], range[1]);

    if ($scope.platformHasConflicts({top: y + 5, right: x + width, bottom: y, left: x})) {
      y = $scope.getRandomPlatformY(x, width);
    }

    return y;
  };

  $scope.generateRandomPlatform = function(range) {
    var x = _.random(700);
    var width = _.random(50, 120);
    var y = $scope.getRandomPlatformY(x, width, range);
    return new Platform({ x: x, y: y }, { x: width, y: 5 });
  };

  $scope.resetPlatforms = function() {
    $scope.platforms = [];
    var platforms_count = Math.floor($scope.environment.level / 3) + 5;
    
    // First platform much be reachable from ground
    var platform = $scope.generateRandomPlatform([20, 30]);
    $scope.platforms.push(platform);

    // The rest of the platforms can be wherever
    do {
      platform = $scope.generateRandomPlatform();
      $scope.platforms.push(platform);
    } while ($scope.platforms.length < platforms_count);
  };

  $scope.gameOver = function() {
    $interval.cancel($scope.environment.watcher);
    $scope.environment.watcher = null;
    $scope.environment.game_over = true;
    $scope.environment.best_score = Math.max($scope.environment.score, $scope.environment.best_score);
    localStorage.setItem('crander_platformer', '{"best_score": ' + $scope.environment.best_score + '}');
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

    if ($scope.environment.time.remaining <= 0 && !$scope.environment.dev) {
      $scope.gameOver();
    }
  };

  $scope.addToRemainingTime = function() {
    $scope.environment.time.remaining = $scope.environment.time.remaining + 7000 + (Math.floor($scope.environment.level / 10) * 1000);
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

  $scope.startGame = function() {
    $scope.gameWatcher();
    $scope.environment.title = false;
  };

  $scope.onPageLoad = function() {
    $scope.player = new Player();
    $scope.resetPlatforms();

    var stored_object = localStorage.getItem('crander_platformer');
    if (!_.isNull(stored_object)) {
      stored_object = JSON.parse(stored_object);
      $scope.environment.best_score = stored_object.best_score
    }
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