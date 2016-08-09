var app = angular.module('platformer', []);
app.controller('Main',['$scope', '$interval', function ($scope, $interval) {
  
  var Player = function() {
    var self = this;
    self.pos = { x: 0, y: 0 };
    self.vel = { x: 0, y: 0 };
    self.size = { x: 40, y: 40 };
    self.dir = 0;
    self.ground = true;
    self.air_jump = false;
    self.constants = {
      acc: {
        air: .33
        , ground: .5
      }
      , max_x: 10
    };
    self.getCSSPosition = function() {
      return { bottom: self.pos.y, left: self.pos.x };
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
    // set with constraints
    self.setVelX = function(x) {
      self.vel.x = Math.min(x, self.constants.max_x);
    };
    self.setVelY = function(y) {
      self.vel.y = y;
    };
    self.adjustVelX = function(x) {
      self.vel.x = Math.min(self.vel.x + x, self.constants.max_x);
    };
    self.adjustVelY = function(y) {
      self.vel.y = self.vel.y + y;
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
  };

  $scope.player = new Player();

  $scope.environment = {
    gravity: .25 // pixels per frame squared?
    , friction: .1
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
    , jump: 0
  }

  $scope.keysdown = {
    right: false
    , left: false
    , up: false
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
      if ($scope.player.isOnGround()) {
        $scope.player.setVelY(10);
        $scope.event_timestamps.jump = $scope.event_timestamps.keydown.up;
      }
      if ($scope.event_timestamps.jump < $scope.event_timestamps.keyup.up && $scope.player.isInAir() && $scope.player.canAirJump()) {
        $scope.player.setVelY(10);
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

  $scope.enforceLimits = function() {
    // If player is on the ground, kill y speed
    if ($scope.player.pos.y <= 0) {
      $scope.player.setVelY(0);
      $scope.player.setPosY(0);
    }

    // If player hits a wall, kill x speed
    if ($scope.player.pos.x >= $scope.environment.limits.x && $scope.player.dir > 0) {
      $scope.player.setVelX(0);
      $scope.player.setPosX($scope.environment.limits.x);
      $scope.player.dir = 0;
    }

    if ($scope.player.pos.x <= 0 && $scope.player.dir < 0) {
      $scope.player.setVelX(0);
      $scope.player.setPosX(0);
      $scope.player.dir = 0;
    }
  };

  $scope.gameWatcher = function() {
    $interval(function() {
      $scope.checkInputs();
      $scope.executeSpeed();
      $scope.executeAcceleration();
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