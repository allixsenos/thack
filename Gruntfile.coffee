module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    compass:
      dist:
        options:
          sassDir: 'sass'
          cssDir: 'css'
    watch:
      compass:
        files: ['sass/*.scss']
        tasks: 'compass'

  grunt.loadNpmTasks 'grunt-contrib-compass'
  grunt.loadNpmTasks 'grunt-contrib-watch'
