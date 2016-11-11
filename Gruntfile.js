module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            "build": {
                "options": {
                    "transform": [
                        "babelify"
                    ],
                    "watch": false,
                    "keepAlive": false
                },
                "files": {
                    "js/build/compiled.js": "js/src/shiftworld.js"
                }
            }
        },
        copy: {
            options: {
                punctuation: ''
            },
            css: {
                files: {
                    'web/css/style.css': ['css/src/style.css']
                }
            },
            js: {
                files: {
                    'web/js/shiftworld.js': ['js/build/compiled.js']
                }
            }
        },
        clean: {
            "build": [
                "js/build"
            ],
            "web": [
                "web/js",
                "web/css"
            ]
        },
        watch: {
            "project": {
                "files": [
                    "js/src/*.js",
                    "css/src/style.css"
                ],
                "tasks": [
                    'clean:build',
                    "browserify:build",
                    'clean:web',
                    "copy:css",
                    "copy:js"
                ]
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Register tasks
    grunt.registerTask(
        'default',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'copy:css',
            'copy:js',
            'watch:project'
        ]
    );

};
