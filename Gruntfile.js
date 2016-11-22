module.exports = function(grunt) {

    // project configuration
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
            },
            vendor: {
                files: {
                    'web/js/vendor/polyfill.js': ['node_modules/babel-polyfill/dist/polyfill.min.js']
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
        uglify: {
            "js": {
                "files": {
                    "js/build/compiled.js": ["js/build/compiled.js"]
                }
            }
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
                    'uglify:js',
                    "copy:css",
                    "copy:js",
                    'copy:vendor'
                ]
            }
        }
    });

    // load the plugins
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // register tasks
    grunt.registerTask(
        'default',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'uglify:js',
            'copy:css',
            'copy:js',
            'copy:vendor',
            'watch:project'
        ]
    );

};
