var app = angular.module('platformer', []);
app.controller('Main',['$scope', '$interval', function ($scope, $interval) {
  
  var Player = function() {
    var self = this;
    self.pos = { x: 0, y: 0 };
    self.vel = { x: 0, y: 0 };
    self.size = { x: 40, y: 40 };
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
        air: .33
        , ground: .5
      }
      , max_x: 10
      , max_y: 15
      , jump_frames: 40
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
  };

  $scope.player = new Player();

  var Platform = function(pos, size) {
    self = this;
    self.pos = pos || { x: 300, y: 100 };
    self.size = size || { x: 80, y: 5 };

    self.getCSSProperties = function() {
      return { bottom: self.pos.y, left: self.pos.x, width: self.size.x, height: self.size.y };
    };
    self.getCollisionObject = function() {
      return { top: self.pos.y + self.size.y, right: self.pos.x + self.size.x, bottom: self.pos.y, left: self.pos.x };
    };
  };

  $scope.platforms = [];

  $scope.platforms.push(new Platform({ x: 300, y: 100 }, { x: 80, y: 80 }));

  $scope.environment = {
    // pixels per frame squared
    gravity: .75
    , friction: .33
    , air_resistance: .25
    , limits: {
      y: 450
      , x: 800
    }
  };

  $scope.event_timestamps = {
    keyup: {
      right: 0
      , left: 0
      , up: 0
    }
    , keydown: {
      right: 0
      , left: 0
      , up: 0
    }
  }

  $scope.keysdown = {
    right: false
    , left: false
    , up: false
  };

  $scope.hasCollided = function(player, platform) {
    return (
      (player.right >= platform.left && player.left <= platform.right)
    ) && (
      (player.top >= platform.bottom && player.bottom <= platform.top)
    );
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

  };

  $scope.checkInputs = function() {
    if ($scope.keysdown.left) {
      $scope.player.adjustVelX($scope.player.isOnGround() ? $scope.player.constants.acc.ground : $scope.player.constants.acc.air);
      $scope.player.dir = -1;
    }

    if ($scope.keysdown.right) {
      $scope.player.adjustVelX($scope.player.isOnGround() ? $scope.player.constants.acc.ground : $scope.player.constants.acc.air);
      $scope.player.dir = 1;
    }

    if ($scope.keysdown.up) {

      // if on ground, record jump time
      // if no jump keyup, keep adding to the speed until you get to max height




      if ($scope.player.isOnGround()) {
        $scope.player.setVelY(15);
        $scope.player.timestamps.jump = $scope.event_timestamps.keydown.up;
      }
      // this is continuous jumping while holding up, but we need to somehow record
      // the peak of the jump, so holding up doesn't affect the player coming down
      // if ($scope.player.isInAir() && $scope.player.timestamps.jump > $scope.event_timestamps.keyup.up && something about total frames jumping being less than the limit) {
      //   $scope.player.setVelY(15);
      // }
      if ($scope.player.timestamps.jump < $scope.event_timestamps.keyup.up && $scope.player.isInAir() && $scope.player.canAirJump()) {
        $scope.player.setVelY(15);
        $scope.player.air_jump = true;
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
    // this is bad, don't check position, check if you're standing on solid ground
    if ($scope.player.isInAir()) {
      $scope.player.adjustVelY($scope.environment.gravity * -1);
    }

  };

  $scope.checkCollision = function() {
    var player = $scope.player.getCollisionObject();

    for (var p in $scope.platforms) {
      var platform = $scope.platforms[p].getCollisionObject();
      
      if ($scope.hasCollided(player, platform)) {
        if ($scope.player.hasNoYCollision()) {
          // we need to find out where the collsion is happening, one of four options
          if ($scope.player.vel.y < 0 && player.top > platform.bottom) {
            $scope.player.stopYMovement(platform.top);
            $scope.player.ground = true;
            $scope.player.air_jump = false;
            $scope.player.col.y = true;
          }
          // if ($scope.player.vel.y > 0 && player.bottom < platform.top) {
          //   $scope.player.stopYMovement(platform.bottom - $scope.player.size.y);
          //   $scope.player.col.y = true;
          // }
          // if ($scope.player.dir > 0 && player.left < platform.right) {
          //   $scope.player.stopXMovement(platform.left + $scope.player.size.x);
          //   $scope.player.col.x = true;
          // }
          // if ($scope.player.dir < 0 && player.right > platform.left) {
          //   $scope.player.stopXMovement(platform.right);
          //   $scope.player.col.x = true;
          // }
        }
      } else {
        if ($scope.player.col.y) {
          $scope.player.col.y = false;
          $scope.player.ground = false;
        }
        if ($scope.player.col.x) {
          $scope.player.col.x = false;
        }
      }
    }
  };

  $scope.enforceLimits = function() {
    // If player is on the ground, kill y speed
    if ($scope.player.pos.y <= 0) {
      $scope.player.stopYMovement(0);
    }

    // If player hits a wall, kill x speed
    if ($scope.player.pos.x + $scope.player.size.x >= $scope.environment.limits.x && $scope.player.dir > 0) {
      $scope.player.stopXMovement($scope.environment.limits.x - $scope.player.size.x);
    }

    if ($scope.player.pos.x <= 0 && $scope.player.dir < 0) {
      $scope.player.stopXMovement(0);
    }
  };

  $scope.gameWatcher = function() {
    $interval(function() {
      $scope.checkInputs();
      $scope.executeSpeed();
      $scope.executeAcceleration();
      $scope.checkCollision();
      $scope.enforceLimits();
    }, 20);
  };

  $scope.gameWatcher();

}]);

app.directive('cdrPlayer', function () {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, element, attrs) {
      
    }
  };
});