module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    sass: {
      dev: {
        options: {
          style: 'compressed'
        },
        files : {
          'css/styles.css':'sass/styles.scss'
        }
      }
    },
    watch: {
      sass: {
        files: ['sass/*.scss'],
        tasks: ['sass:dev']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  // Default task(s).
  grunt.registerTask('default', ['sass:dev','watch:sass']);

};