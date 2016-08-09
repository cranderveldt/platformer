var app = angular.module('platformer', []);
app.controller('Main',['$scope', '$interval', function ($scope, $interval) {
  
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

  $scope.player = {
    position: {bottom: 0, left: 0}
    , speed: {x: 0, y: 0}
    , direction: 0
    , ground: true
    , air_jump: false
    , constants: {
      air: {
        acc: .33
        , max_speed: 10
      }
      , ground: {
        acc: .5
        , max_speed: 10
      }
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
      var acc = $scope.player.ground ? $scope.player.constants.ground.acc : $scope.player.constants.air.acc
      $scope.player.speed.x = Math.min($scope.player.speed.x + acc, $scope.player.constants.ground.max_speed);
      $scope.player.direction = -1;
    }
    if ($scope.keysdown.right) {
      var acc = $scope.player.ground ? $scope.player.constants.ground.acc : $scope.player.constants.air.acc
      $scope.player.speed.x = Math.min($scope.player.speed.x + acc, $scope.player.constants.ground.max_speed);
      $scope.player.direction = 1;
    }
    if ($scope.keysdown.up) {
      if ($scope.player.ground) {
        $scope.player.speed.y = 10;
        $scope.event_timestamps.jump = $scope.event_timestamps.keydown.up;
      }
      if ($scope.event_timestamps.jump < $scope.event_timestamps.keyup.up && !$scope.player.ground && !$scope.player.air_jump) {
        $scope.player.speed.y = 10;
        $scope.player.air_jump = true;
      }
    }
  };

  $scope.executeSpeed = function() {
    // Check if the player has speed, move the position
    if ($scope.player.speed.y !== 0) {
      $scope.player.position.bottom = $scope.player.position.bottom + $scope.player.speed.y;
      
      // Setting the ground flag here when we move position
      if ($scope.player.position.bottom > 0) {
        $scope.player.ground = false;
      } else {
        $scope.player.ground = true;
        $scope.player.air_jump = false;
      }
    }

    if ($scope.player.speed.x > 0) {
      $scope.player.position.left = $scope.player.position.left + ($scope.player.speed.x * $scope.player.direction);
      
      // Air resistance & friction
      if ($scope.player.ground) {
        $scope.player.speed.x = $scope.player.speed.x - $scope.environment.friction;
      } else {
        $scope.player.speed.x = $scope.player.speed.x - $scope.environment.air_resistance;
      }
    }
  };

  $scope.executeAcceleration = function() {
    if (!$scope.keysdown.right && !$scope.keysdown.left && $scope.player.speed.x > 0) {
      // Air resistance & friction
      if ($scope.player.ground) {
        $scope.player.speed.x = $scope.player.speed.x - $scope.environment.friction;
      } else {
        $scope.player.speed.x = $scope.player.speed.x - $scope.environment.air_resistance;
      }
    }

    // If the player isn't on the ground, apply gravity effects
    // this is bad, don't check position, check if you're standing on solid ground
    if (!$scope.player.ground) {
      $scope.player.speed.y = $scope.player.speed.y - $scope.environment.gravity;
    }

  };

  $scope.enforceLimits = function() {
    // If player is on the ground, kill y speed
    if ($scope.player.position.bottom <= 0) {
      $scope.player.speed.y = 0;
      $scope.player.position.bottom = 0;
    }

    // If player hits a wall, kill x speed
    if ($scope.player.position.left >= $scope.environment.limits.x && $scope.player.direction > 0) {
      $scope.player.speed.x = 0;
      $scope.player.direction = 0;
      $scope.player.position.left = $scope.environment.limits.x;
    }

    if ($scope.player.position.left <= 0 && $scope.player.direction < 0) {
      $scope.player.speed.x = 0;
      $scope.player.direction = 0;
      $scope.player.position.left = 0;
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